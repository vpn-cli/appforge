import { describe, it, expect, vi, beforeEach } from "vitest";
import { authorizeAppAccess } from "@/lib/app-access";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock Supabase server client
vi.mock("@/lib/insforge-server", () => ({
  createInsforgeServer: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { createInsforgeServer } from "@/lib/insforge-server";

describe("authorizeAppAccess tenant isolation and access control", () => {
  const validAppId = "11111111-2222-3333-4444-555555555555";
  const validEntity = "leads";
  const ownerUserId = "user_owner_123";
  const otherUserId = "user_attacker_456";

  let mockAppsTable: Record<string, unknown>[] = [];
  let mockSchemasTable: Record<string, unknown>[] = [];

  beforeEach(() => {
    vi.clearAllMocks();

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

  it("returns 401 when signed out (no userId)", async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
    const result = await authorizeAppAccess(validAppId, validEntity, "read");
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
    const body = await result.error?.json();
    expect(body.error).toBe("Unauthorized");
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
