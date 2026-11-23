import { describe, it, expect, vi, beforeEach } from "vitest";
import { authorizeAppAccess } from "@/lib/app-access";
import { GET } from "@/app/api/proxy/[appId]/[entity]/route";
import { getClientIp } from "@/lib/proxy-helpers";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock Supabase server client
vi.mock("@/lib/insforge-server", () => ({
  createInsforgeServer: vi.fn(),
}));

// Mock rate limiter while preserving real constants for verification
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    publicReadRateLimit: {
      limit: vi.fn(),
    },
  };
});

import { auth } from "@clerk/nextjs/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import {
  publicReadRateLimit,
  PUBLIC_READ_RATE_LIMIT_MAX,
  PUBLIC_READ_RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/rate-limit";

describe("authorizeAppAccess tenant isolation and access control", () => {
  const validAppId = "11111111-2222-3333-4444-555555555555";
  const validEntity = "leads";
  const ownerUserId = "user_owner_123";
  const otherUserId = "user_attacker_456";

  let mockAppsTable: Record<string, unknown>[] = [];
  let mockSchemasTable: Record<string, unknown>[] = [];

  beforeEach(() => {
    vi.clearAllMocks();

    (publicReadRateLimit.limit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      limit: PUBLIC_READ_RATE_LIMIT_MAX,
      remaining: PUBLIC_READ_RATE_LIMIT_MAX - 1,
      reset: Date.now() + 60000,
    });

    mockAppsTable = [
      {
        id: validAppId,
        user_id: ownerUserId,
        published_config: null, // private by default
      },
      {
        id: "22222222-3333-4444-5555-666666666666",
        user_id: ownerUserId,
        published_config: { app: "Published App" }, // published app
      },
    ];

    mockSchemasTable = [
      {
        app_id: validAppId,
        table_name: validEntity,
      },
      {
        app_id: "22222222-3333-4444-5555-666666666666",
        table_name: validEntity,
      },
    ];

    const createMockQueryBuilder = (tableName: string) => {
      let filterCol = "";
      let filterVal: unknown = null;
      let inCol = "";
      let inVals: unknown[] = [];

      const builder: Record<string, unknown> = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn(async () => ({ data: [], error: null })),
        eq: vi.fn((col: string, val: unknown) => {
          filterCol = col;
          filterVal = val;
          return builder;
        }),
        in: vi.fn((col: string, vals: unknown[]) => {
          inCol = col;
          inVals = vals;
          return builder;
        }),
        maybeSingle: vi.fn(async () => {
          if (tableName === "apps") {
            const found = mockAppsTable.find((row) => row[filterCol] === filterVal);
            return { data: found || null, error: null };
          }
          if (tableName === "app_schemas") {
            const found = mockSchemasTable.find((row) => {
              const eqMatch = filterCol ? row[filterCol] === filterVal : true;
              const inMatch = inCol ? inVals.includes(row[inCol]) : true;
              return eqMatch && inMatch;
            });
            return { data: found || null, error: null };
          }
          return { data: null, error: null };
        }),
      };
      return builder;
    };

    (createInsforgeServer as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: vi.fn((tbl: string) => createMockQueryBuilder(tbl)),
    });
  });

  it("returns 400 for invalid UUID app id", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: ownerUserId });
    const result = await authorizeAppAccess("invalid-uuid", validEntity, "read");
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(400);
    const body = await result.error?.json();
    expect(body.error).toBe("Invalid app id");
  });

  it("returns 400 for bad entity name", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: ownerUserId });
    const result = await authorizeAppAccess(validAppId, "123_invalid_entity", "read");
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(400);
    const body = await result.error?.json();
    expect(body.error).toBe("Invalid entity");
  });

  it("returns 401 for write when signed out (no userId)", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
    const result = await authorizeAppAccess(validAppId, validEntity, "write");
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
    const body = await result.error?.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 for signed-out read on an unpublished app", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
    const result = await authorizeAppAccess(validAppId, validEntity, "read", { clientIp: "198.51.100.1" });
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(404);
    const body = await result.error?.json();
    expect(body.error).toBe("Not found");
    expect(publicReadRateLimit.limit).toHaveBeenCalledWith("proxy_public_read:198.51.100.1");
  });

  it("allows signed-out read on a published app with per-IP rate limiting", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
    const publishedAppId = "22222222-3333-4444-5555-666666666666";
    const result = await authorizeAppAccess(publishedAppId, validEntity, "read", { clientIp: "198.51.100.2" });
    expect(result.error).toBeUndefined();
    expect(result.isOwner).toBe(false);
    expect(result.tableName).toBe(`app_${publishedAppId.replace(/-/g, "_")}_${validEntity}`);
    expect(publicReadRateLimit.limit).toHaveBeenCalledWith("proxy_public_read:198.51.100.2");
  });

  it("returns 429 when per-IP rate limit is exceeded on signed-out read", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
    (publicReadRateLimit.limit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      limit: PUBLIC_READ_RATE_LIMIT_MAX,
      remaining: 0,
      reset: 1700000060000,
    });
    const publishedAppId = "22222222-3333-4444-5555-666666666666";
    const result = await authorizeAppAccess(publishedAppId, validEntity, "read", { clientIp: "198.51.100.3" });
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(429);
    expect(result.error?.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("a spoofed x-forwarded-for header does not change the rate-limit key", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
    const publishedAppId = "22222222-3333-4444-5555-666666666666";

    // 1. Baseline request with trusted Vercel edge header `x-real-ip`
    const reqReal = new Request(`http://localhost:3000/api/proxy/${publishedAppId}/${validEntity}`, {
      method: "GET",
      headers: { "x-real-ip": "198.51.100.42" },
    });
    const res1 = await GET(reqReal, { params: Promise.resolve({ appId: publishedAppId, entity: validEntity }) });
    expect(res1.status).toBe(200);

    // 2. Same client spoofing `x-forwarded-for` must hash to the exact same rate-limit key
    const reqSpoofed = new Request(`http://localhost:3000/api/proxy/${publishedAppId}/${validEntity}`, {
      method: "GET",
      headers: {
        "x-real-ip": "198.51.100.42",
        "x-forwarded-for": "203.0.113.99, 10.0.0.1",
      },
    });
    const res2 = await GET(reqSpoofed, { params: Promise.resolve({ appId: publishedAppId, entity: validEntity }) });
    expect(res2.status).toBe(200);

    const calls = (publicReadRateLimit.limit as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe("proxy_public_read:198.51.100.42");
    expect(calls[1][0]).toBe("proxy_public_read:198.51.100.42");
    expect(calls[0][0]).toBe(calls[1][0]);

    // 3. Without `x-real-ip`, spoofed `x-forwarded-for` is ignored and falls back to 127.0.0.1
    const reqSpoofedOnly = new Request(`http://localhost:3000/api/proxy/${publishedAppId}/${validEntity}`, {
      method: "GET",
      headers: { "x-forwarded-for": "203.0.113.77" },
    });
    expect(getClientIp(reqSpoofedOnly)).toBe("127.0.0.1");
    await GET(reqSpoofedOnly, { params: Promise.resolve({ appId: publishedAppId, entity: validEntity }) });
    expect(calls[2][0]).toBe("proxy_public_read:127.0.0.1");
  });

  it("public-read rate limit budget supports loading and refreshing multi-DataTable pages without 429", async () => {
    expect(PUBLIC_READ_RATE_LIMIT_MAX).toBe(120);
    expect(PUBLIC_READ_RATE_LIMIT_WINDOW_SECONDS).toBe(60);

    const { publicReadRateLimit: realPublicLimiter } = await vi.importActual<typeof import("@/lib/rate-limit")>(
      "@/lib/rate-limit"
    );
    const key = `proxy_public_read:198.51.100.99-${Date.now()}`;
    // Simulate a page with 6 DataTables loaded and refreshed 5 times (30 reads)
    for (let i = 0; i < 30; i++) {
      const res = await realPublicLimiter.limit(key);
      expect(res.success).toBe(true);
      expect(res.limit).toBe(120);
    }
  });

  it("returns 404 for unknown app id", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: ownerUserId });
    const nonExistentAppId = "99999999-9999-9999-9999-999999999999";
    const result = await authorizeAppAccess(nonExistentAppId, validEntity, "read");
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(404);
  });

  it("returns 404 for non-owner accessing a private (unpublished) app", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: otherUserId });
    const result = await authorizeAppAccess(validAppId, validEntity, "read");
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(404);
  });

  it("returns 404 for non-owner attempting write on a published app", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: otherUserId });
    const publishedAppId = "22222222-3333-4444-5555-666666666666";
    const result = await authorizeAppAccess(publishedAppId, validEntity, "write");
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(404);
  });

  it("allows non-owner read on a published app", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: otherUserId });
    const publishedAppId = "22222222-3333-4444-5555-666666666666";
    const result = await authorizeAppAccess(publishedAppId, validEntity, "read");
    expect(result.error).toBeUndefined();
    expect(result.isOwner).toBe(false);
    expect(result.tableName).toBe(`app_${publishedAppId.replace(/-/g, "_")}_${validEntity}`);
  });

  it("allows owner both read and write access on their app", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: ownerUserId });
    
    // Read
    const readResult = await authorizeAppAccess(validAppId, validEntity, "read");
    expect(readResult.error).toBeUndefined();
    expect(readResult.isOwner).toBe(true);
    expect(readResult.tableName).toBe(`app_${validAppId.replace(/-/g, "_")}_${validEntity}`);

    // Write
    const writeResult = await authorizeAppAccess(validAppId, validEntity, "write");
    expect(writeResult.error).toBeUndefined();
    expect(writeResult.isOwner).toBe(true);
  });

  it("returns 404 if entity does not exist in app_schemas", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: ownerUserId });
    const unmappedEntity = "unregistered";
    const result = await authorizeAppAccess(validAppId, unmappedEntity, "read");
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(404);
  });

  it("rejects non-owner trying to use skipEntityCheck for DDL (returns 404)", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: otherUserId });
    const publishedAppId = "22222222-3333-4444-5555-666666666666";
    const result = await authorizeAppAccess(publishedAppId, "newentity", "write", {
      skipEntityCheck: true,
    });
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(404);
  });

  it("rejects owner using skipEntityCheck with mode='read' (returns 404)", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: ownerUserId });
    const result = await authorizeAppAccess(validAppId, "newentity", "read", {
      skipEntityCheck: true,
    });
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(404);
  });

  it("allows owner using skipEntityCheck with mode='write' for DDL creation", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: ownerUserId });
    const result = await authorizeAppAccess(validAppId, "newentity", "write", {
      skipEntityCheck: true,
    });
    expect(result.error).toBeUndefined();
    expect(result.isOwner).toBe(true);
    expect(result.tableName).toBe(`app_${validAppId.replace(/-/g, "_")}_newentity`);
  });
});
