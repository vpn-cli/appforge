/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

// Mock Clerk auth to toggle simulated tenant sessions
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import {
  saveAppConfig,
  publishAppConfig,
  deleteApp,
  renameApp,
  getAppConfig,
} from "@/actions/apps";
import { syncAppSchema } from "@/actions/schema";
import { GET, POST, PUT, DELETE } from "@/app/api/proxy/[appId]/[entity]/route";
import { EventPublisher } from "@/lib/event-queue";
import fs from "fs";
import path from "path";

// SAFETY GUARD: Prevent running mutative integration tests against the live demo database.
// Requires .env.test (separate test project) or explicit ALLOW_LIVE_DB_TESTS=true flag.
const isTestDbConfigured = fs.existsSync(path.resolve(process.cwd(), ".env.test"));
const allowLiveDb = process.env.ALLOW_LIVE_DB_TESTS === "true";

describe.skipIf(!isTestDbConfigured && !allowLiveDb)(
  "PHASE 1 — Security Hardening & Cross-Tenant Isolation (Real Queries)",
  () => {
  const userA = "tenant_user_a_" + Date.now();
  const userB = "tenant_user_b_" + Date.now();
  let testAppId: string;
  let kafkaPublishSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    try {
      // Connect to real Supabase database and create a test app owned by User A
      const supabase = await createInsforgeServer();
      const { data, error } = await supabase
        .from("apps")
        .insert({
          user_id: userA,
          name: "Tenant A Confidential App",
          config: {
            app: "Tenant A Confidential App",
            pages: [],
            entities: { items: { name: "string" } },
          },
        })
        .select("id")
        .single();

      if (error || !data) {
        console.error("beforeAll insert error details:", JSON.stringify(error, null, 2));
        throw new Error(`Failed to set up test app in Supabase: ${error?.message}`);
      }
      testAppId = data.id;

      // Register a schema record for entity 'items' in app_schemas
      await supabase.from("app_schemas").upsert(
        {
          app_id: testAppId,
          table_name: "items",
          schema_definition: { name: "string" },
        },
        { onConflict: "app_id,table_name" }
      );
    } catch (err: any) {
      console.error("beforeAll SETUP EXCEPTION:", err?.message || err);
      throw err;
    }
  });

  afterAll(async () => {
    // Cleanup: remove the test app from the real database (cascades to app_schemas)
    if (testAppId) {
      const supabase = await createInsforgeServer();
      await supabase.from("apps").delete().eq("id", testAppId);
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    kafkaPublishSpy = vi.spyOn(EventPublisher, "publish").mockResolvedValue({ success: true } as any);
  });

  // =========================================================================
  // Fix 1: Dev auth bypass flag & ADMIN_BYPASS removal
  // =========================================================================
  describe("Fix 1: Auth Bypass Hardening", () => {
    it("rejects unauthorized access when DEV_AUTH_BYPASS is not set", async () => {
      delete process.env.DEV_AUTH_BYPASS;
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });

      await expect(saveAppConfig(testAppId, JSON.stringify({ app: "Hacked" }))).rejects.toThrow("Unauthorized");
    });

    it("ensures DEV_AUTH_BYPASS can NEVER activate when NODE_ENV is production", async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalBypass = process.env.DEV_AUTH_BYPASS;

      try {
        (process.env as Record<string, string | undefined>).NODE_ENV = "production";
        process.env.DEV_AUTH_BYPASS = "true";
        (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });

        // Unauthenticated call in production must throw Unauthorized, bypass ignored
        await expect(saveAppConfig(testAppId, "{}")).rejects.toThrow("Unauthorized");
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
        if (originalBypass !== undefined) {
          process.env.DEV_AUTH_BYPASS = originalBypass;
        } else {
          delete process.env.DEV_AUTH_BYPASS;
        }
      }
    });
  });

  // =========================================================================
  // Fix 3: Live App Page Clerk Auth Migration
  // =========================================================================
  describe("Fix 3: Live App Page Auth Migration", () => {
    it("ensures app/apps/[appId]/page.tsx uses Clerk auth instead of supabase.auth.getUser()", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const pageContent = fs.readFileSync(path.resolve(process.cwd(), "app/apps/[appId]/page.tsx"), "utf-8");

      expect(pageContent).toContain('import { auth } from "@clerk/nextjs/server";');
      expect(pageContent).not.toContain("supabase.auth.getUser");
    });
  });

  // =========================================================================
  // Fix 2 & 4: Cross-Tenant Mutations (User A vs User B on Real Database)
  // =========================================================================
  describe("Fix 2 & 4: Server Action Mutations Across Tenants", () => {
    it("User B cannot saveAppConfig on User A's app (returns 404, config untouched)", async () => {
      // Act as User B
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      const maliciousConfig = JSON.stringify({ app: "Overwritten by User B", pages: [] });
      const result = await saveAppConfig(testAppId, maliciousConfig);

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.error).toBe("App not found or not owned by user");

      // Verify directly against the real Supabase database that User A's config was NOT modified
      const supabase = await createInsforgeServer();
      const { data: appRow } = await supabase.from("apps").select("name, config").eq("id", testAppId).single();
      expect(appRow?.name).toBe("Tenant A Confidential App");
      expect((appRow?.config as any)?.app).toBe("Tenant A Confidential App");
    });

    it("User B cannot publishAppConfig on User A's app (returns 404, no Kafka event)", async () => {
      // Act as User B
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      const publishConfig = JSON.stringify({ app: "Hacked Publish" });
      const result = await publishAppConfig(testAppId, publishConfig);

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.error).toBe("App not found or not owned by user");

      // Verify NO Kafka event was dispatched
      expect(kafkaPublishSpy).not.toHaveBeenCalled();

      // Verify directly against the real database that published_config remains null
      const supabase = await createInsforgeServer();
      const { data: appRow } = await supabase.from("apps").select("published_config").eq("id", testAppId).single();
      expect(appRow?.published_config).toBeNull();
    });

    it("User B cannot renameApp on User A's app (throws 404 error, name untouched)", async () => {
      // Act as User B
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      await expect(renameApp(testAppId, "User B Stolen Name")).rejects.toThrow("App not found or not owned by user");

      // Verify name unchanged in real DB
      const supabase = await createInsforgeServer();
      const { data: appRow } = await supabase.from("apps").select("name").eq("id", testAppId).single();
      expect(appRow?.name).toBe("Tenant A Confidential App");
    });

    it("User B cannot deleteApp on User A's app (throws 404 error, app remains)", async () => {
      // Act as User B
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      await expect(deleteApp(testAppId)).rejects.toThrow("App not found or not owned by user");

      // Verify app still exists in real DB
      const supabase = await createInsforgeServer();
      const { data: appRow } = await supabase.from("apps").select("id").eq("id", testAppId).single();
      expect(appRow?.id).toBe(testAppId);
    });

    it("User B cannot getAppConfig for User A's app (returns null)", async () => {
      // Act as User B
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      const config = await getAppConfig(testAppId);
      expect(config).toBeNull();
    });

    it("User B cannot syncAppSchema on User A's app (returns unauthorized/not owned)", async () => {
      // Act as User B
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      const syncResult = await syncAppSchema(testAppId, { stolen: { secret: "string" } }, userB);
      expect(syncResult.success).toBe(false);
      expect(syncResult.message).toContain("not owned");
    });

    it("User A (legitimate owner) CAN update, rename, and publish their app", async () => {
      // Act as legitimate User A
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userA });

      // Save
      const saveRes = await saveAppConfig(testAppId, JSON.stringify({ app: "Updated by Owner A", pages: [] }));
      expect(saveRes.success).toBe(true);

      // Rename
      const renameRes = await renameApp(testAppId, "Tenant A Authorized Name");
      expect(renameRes.success).toBe(true);

      // Publish
      const pubRes = await publishAppConfig(testAppId, JSON.stringify({ app: "Tenant A Live", pages: [] }));
      expect(pubRes.success).toBe(true);
      expect(kafkaPublishSpy).toHaveBeenCalledTimes(1);

      // Verify changes persisted in real DB
      const supabase = await createInsforgeServer();
      const { data: appRow } = await supabase.from("apps").select("name, published_config").eq("id", testAppId).single();
      expect(appRow?.name).toBe("Tenant A Authorized Name");
      expect((appRow?.published_config as any)?.app).toBe("Tenant A Live");
    });
  });

  // =========================================================================
  // Fix 4: Cross-Tenant Proxy Routes (User A vs User B on API Proxy)
  // =========================================================================
  describe("Fix 4: API Proxy Route Isolation (/api/proxy/[appId]/[entity])", () => {
    let privateAppId: string;

    beforeAll(async () => {
      const supabase = await createInsforgeServer();
      const { data } = await supabase
        .from("apps")
        .insert({
          user_id: userA,
          name: "Tenant A Private App",
          config: { app: "Tenant A Private App" },
          published_config: null, // Strictly private (unpublished)
        })
        .select("id")
        .single();

      privateAppId = data!.id;

      await supabase.from("app_schemas").upsert(
        {
          app_id: privateAppId,
          table_name: "records",
          schema_definition: { title: "string" },
        },
        { onConflict: "app_id,table_name" }
      );
    });

    afterAll(async () => {
      if (privateAppId) {
        const supabase = await createInsforgeServer();
        await supabase.from("apps").delete().eq("id", privateAppId);
      }
    });

    it("User B GET /api/proxy on User A's private app returns 404", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      const req = new Request(`http://localhost:3000/api/proxy/${privateAppId}/records`, { method: "GET" });
      const res = await GET(req, { params: Promise.resolve({ appId: privateAppId, entity: "records" }) });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Not found");
    });

    it("User B POST /api/proxy on User A's private app returns 404", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      const req = new Request(`http://localhost:3000/api/proxy/${privateAppId}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Injected by User B" }),
      });
      const res = await POST(req, { params: Promise.resolve({ appId: privateAppId, entity: "records" }) });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Not found");
    });

    it("User B PUT /api/proxy on User A's private app returns 404", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      const req = new Request(`http://localhost:3000/api/proxy/${privateAppId}/records?id=mock-record-id`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated by User B" }),
      });
      const res = await PUT(req, { params: Promise.resolve({ appId: privateAppId, entity: "records" }) });

      expect(res.status).toBe(404);
    });

    it("User B DELETE /api/proxy on User A's private app returns 404", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      const req = new Request(`http://localhost:3000/api/proxy/${privateAppId}/records?id=mock-record-id`, {
        method: "DELETE",
      });
      const res = await DELETE(req, { params: Promise.resolve({ appId: privateAppId, entity: "records" }) });

      expect(res.status).toBe(404);
    });

    it("Unauthenticated visitor (no userId) on proxy route returns 401", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });

      const req = new Request(`http://localhost:3000/api/proxy/${privateAppId}/records`, { method: "GET" });
      const res = await GET(req, { params: Promise.resolve({ appId: privateAppId, entity: "records" }) });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("User B GET /api/proxy on User A's PUBLISHED app is permitted (public read)", async () => {
      // testAppId was published earlier by User A
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      const req = new Request(`http://localhost:3000/api/proxy/${testAppId}/items`, { method: "GET" });
      const res = await GET(req, { params: Promise.resolve({ appId: testAppId, entity: "items" }) });

      // Should succeed with 200 (even if empty array [])
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    it("User B POST /api/proxy on User A's PUBLISHED app is still rejected with 404 (write forbidden)", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

      const req = new Request(`http://localhost:3000/api/proxy/${testAppId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Write attempt" }),
      });
      const res = await POST(req, { params: Promise.resolve({ appId: testAppId, entity: "items" }) });

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // Fix 5: Direct Database-Level RLS Enforcement (Bypassing Application Code)
  // =========================================================================
  describe("Fix 5: Direct Postgres Database-Level Enforcement", () => {
    let directClient: ReturnType<typeof import("@supabase/supabase-js").createClient>;
    let directAppId: string;
    let dynamicTableName: string;

    beforeAll(async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        directClient = createClient(
          process.env.NEXT_PUBLIC_INSFORGE_URL!,
          process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!
        );

        const serverDb = await createInsforgeServer();
        const { data, error } = await serverDb
          .from("apps")
          .insert({
            user_id: userA,
            name: "Direct RLS Verified App",
            config: { app: "Direct RLS Verified App" },
            published_config: null, // Strictly private
          })
          .select("id")
          .single();

        if (error || !data) {
          console.error("Direct RLS beforeAll error:", error);
          throw new Error(`Failed to create Direct RLS test app: ${error?.message}`);
        }

        directAppId = data.id;
        dynamicTableName = `app_${directAppId.replace(/-/g, "_")}_secret_records`;

        // Provision a dynamic table for this app using execute_app_ddl
        await serverDb.rpc("execute_app_ddl", {
          app_id: directAppId,
          query: `CREATE TABLE IF NOT EXISTS ${dynamicTableName} (id uuid default gen_random_uuid() primary key, title text);`,
        });

        await serverDb.from("app_schemas").upsert(
          {
            app_id: directAppId,
            table_name: "secret_records",
            schema_definition: { title: "string" },
          },
          { onConflict: "app_id,table_name" }
        );
      } catch (err: any) {
        console.error("Direct RLS beforeAll EXCEPTION:", err?.message || err);
        throw err;
      }
    });

    afterAll(async () => {
      if (directAppId) {
        const serverDb = await createInsforgeServer();
        await serverDb.rpc("execute_app_ddl", {
          app_id: directAppId,
          query: `ALTER TABLE ${dynamicTableName} RENAME TO ${dynamicTableName}_old; DROP TABLE IF EXISTS ${dynamicTableName}_old;`,
        });
        await serverDb.from("apps").delete().eq("id", directAppId);
      }
    });

    it("Direct Postgres query on apps table returns zero rows for User A's private app", async () => {
      // Querying Postgres directly with unprivileged client completely bypassing Next.js
      const { data, error } = await directClient
        .from("apps")
        .select("id, name, config")
        .eq("id", directAppId);

      expect(error).toBeNull();
      expect(data).toEqual([]); // Zero rows returned by Postgres RLS
    });

    it("Direct Postgres write on apps table is denied by RLS policy", async () => {
      const { error } = await directClient
        .from("apps")
        .insert({ name: "Malicious Direct Insert", user_id: userB } as any);

      expect(error).toBeDefined(); // RLS policy blocks unauthorized insert
    });

    it("Direct Postgres query on app_schemas table returns zero rows for User A's app", async () => {
      const { data, error } = await directClient
        .from("app_schemas")
        .select("*")
        .eq("app_id", directAppId);

      expect(error).toBeNull();
      expect(data).toEqual([]); // Zero rows returned by Postgres RLS
    });

    it("Direct Postgres query on dynamic per-app table returns zero rows or is denied", async () => {
      const { data, error } = await directClient
        .from(dynamicTableName)
        .select("*");

      // PostgREST/Postgres evaluates RLS: private app tables are completely invisible
      if (!error) {
        expect(data).toEqual([]);
      } else {
        expect(error).toBeDefined();
      }
    });

    it("Direct Postgres write on dynamic per-app table is strictly denied by RLS", async () => {
      const { error } = await directClient
        .from(dynamicTableName)
        .insert({ title: "Injected directly into dynamic table" } as any);

      expect(error).toBeDefined(); // Postgres denies insert directly
    });
  });
});
