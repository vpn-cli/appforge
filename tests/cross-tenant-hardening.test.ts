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

// SAFETY GUARD: Integration tests require a dedicated test database (TEST_SUPABASE_URL).
// Direct execution against production project 'upljqampxcmhqjszatrp' is strictly prohibited.
const testDbUrl = process.env.TEST_SUPABASE_URL;
const testServiceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const isLiveDemoDb = Boolean(
  (testDbUrl && testDbUrl.includes("upljqampxcmhqjszatrp")) ||
  (!testDbUrl && process.env.NEXT_PUBLIC_INSFORGE_URL?.includes("upljqampxcmhqjszatrp"))
);

const canRunDbTests = Boolean(testDbUrl && testServiceKey && !isLiveDemoDb);

describe.skipIf(!canRunDbTests)(
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
  // Fix 3: [Static Check] Live App Page Clerk Auth Migration
  // =========================================================================
  describe("Fix 3: [Static Check] Live App Page Auth Migration", () => {
    it("[Static Check] verifies app/apps/[appId]/page.tsx uses Clerk auth instead of supabase.auth.getUser()", async () => {
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

    it("Positive Control: User B (legitimate owner of App B) CAN update, rename, publish, and delete B's own app", async () => {
      const supabase = await createInsforgeServer();
      // Create App B owned by User B
      const { data: appB } = await supabase
        .from("apps")
        .insert({
          user_id: userB,
          name: "Tenant B Independent App",
          config: { app: "Tenant B Independent App", pages: [] },
        })
        .select("id")
        .single();

      expect(appB?.id).toBeDefined();
      const testAppIdB = appB!.id;

      try {
        // Act as User B
        (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

        // User B reads B's own app config
        const configB = await getAppConfig(testAppIdB);
        expect(configB).not.toBeNull();
        expect((configB as any)?.app).toBe("Tenant B Independent App");

        // User B updates B's own app
        const saveRes = await saveAppConfig(testAppIdB, JSON.stringify({ app: "Updated by Owner B", pages: [] }));
        expect(saveRes.success).toBe(true);

        // User B renames B's own app
        const renameRes = await renameApp(testAppIdB, "Tenant B Renamed App");
        expect(renameRes.success).toBe(true);

        // User B publishes B's own app
        const pubRes = await publishAppConfig(testAppIdB, JSON.stringify({ app: "Tenant B Live", pages: [] }));
        expect(pubRes.success).toBe(true);

        // User B syncs schema on B's own app
        const schemaRes = await syncAppSchema(testAppIdB, { notes: { text: "string" } }, userB);
        expect(schemaRes.success).toBe(true);

        // User B deletes B's own app
        const delRes = await deleteApp(testAppIdB);
        expect(delRes.success).toBe(true);

        // Verify App B is gone from DB
        const { data: checkDeleted } = await supabase.from("apps").select("id").eq("id", testAppIdB).maybeSingle();
        expect(checkDeleted).toBeNull();
      } finally {
        await supabase.from("apps").delete().eq("id", testAppIdB);
      }
    }, 20000);
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

    it("Positive Control: User B CAN insert, read, update, and delete B's own rows via /api/proxy", async () => {
      const supabase = await createInsforgeServer();
      const { data: bApp } = await supabase
        .from("apps")
        .insert({
          user_id: userB,
          name: "User B Private Store",
          config: { app: "User B Private Store" },
          published_config: null,
        })
        .select("id")
        .single();
      const userBAppId = bApp!.id;
      const bTableName = `app_${userBAppId.replace(/-/g, "_")}_items`;

      try {
        await supabase.rpc("execute_app_ddl", {
          app_id: userBAppId,
          query: `CREATE TABLE IF NOT EXISTS ${bTableName} (id uuid default gen_random_uuid() primary key, name text, created_at timestamptz default now());`,
        });
        await supabase.from("app_schemas").upsert(
          {
            app_id: userBAppId,
            table_name: "items",
            schema_definition: { name: "string" },
          },
          { onConflict: "app_id,table_name" }
        );

        // Act as User B
        (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: userB });

        // 1. User B POST row to B's own app
        const postReq = new Request(`http://localhost:3000/api/proxy/${userBAppId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "User B Private Item" }),
        });
        const postRes = await POST(postReq, { params: Promise.resolve({ appId: userBAppId, entity: "items" }) });
        expect(postRes.status).toBe(201);
        const createdRow = await postRes.json();
        expect(createdRow.name).toBe("User B Private Item");
        const rowId = createdRow.id;

        // 2. User B GET rows from B's own app
        const getReq = new Request(`http://localhost:3000/api/proxy/${userBAppId}/items`, { method: "GET" });
        const getRes = await GET(getReq, { params: Promise.resolve({ appId: userBAppId, entity: "items" }) });
        expect(getRes.status).toBe(200);
        const rows = await getRes.json();
        expect(Array.isArray(rows)).toBe(true);
        expect(rows.length).toBe(1);
        expect(rows[0].name).toBe("User B Private Item");

        // 3. User B PUT update row in B's own app
        const putReq = new Request(`http://localhost:3000/api/proxy/${userBAppId}/items?id=${rowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "User B Updated Item" }),
        });
        const putRes = await PUT(putReq, { params: Promise.resolve({ appId: userBAppId, entity: "items" }) });
        expect(putRes.status).toBe(200);
        const updatedRow = await putRes.json();
        expect(updatedRow.name).toBe("User B Updated Item");

        // 4. User B DELETE row in B's own app
        const delReq = new Request(`http://localhost:3000/api/proxy/${userBAppId}/items?id=${rowId}`, {
          method: "DELETE",
        });
        const delRes = await DELETE(delReq, { params: Promise.resolve({ appId: userBAppId, entity: "items" }) });
        expect(delRes.status).toBe(200);

        // Verify table is empty
        const verifyReq = new Request(`http://localhost:3000/api/proxy/${userBAppId}/items`, { method: "GET" });
        const verifyRes = await GET(verifyReq, { params: Promise.resolve({ appId: userBAppId, entity: "items" }) });
        expect(verifyRes.status).toBe(200);
        const remaining = await verifyRes.json();
        expect(remaining).toEqual([]);
      } finally {
        await supabase.rpc("execute_app_ddl", {
          app_id: userBAppId,
          query: `DROP TABLE IF EXISTS ${bTableName};`,
        });
        await supabase.from("apps").delete().eq("id", userBAppId);
      }
    }, 20000);
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
        const clientUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_INSFORGE_URL!;
        const clientAnonKey = process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;
        directClient = createClient(clientUrl, clientAnonKey);

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

    it("Anonymous client query on apps table returns zero rows for private app", async () => {
      // Querying Postgres directly with unprivileged anonymous client (bypassing Next.js)
      const { data, error } = await directClient
        .from("apps")
        .select("id, name, config")
        .eq("id", directAppId);

      expect(error).toBeNull();
      expect(data).toEqual([]); // Zero rows returned by Postgres RLS
    });

    it("Anonymous client write on apps table is denied by RLS policy (error 42501)", async () => {
      const { error } = await directClient
        .from("apps")
        .insert({ name: "Malicious Direct Insert", user_id: userB } as any);

      expect(error).not.toBeNull();
      expect(error?.code).toBe("42501");
    });

    it("Anonymous client query on app_schemas table returns zero rows for private app", async () => {
      const { data, error } = await directClient
        .from("app_schemas")
        .select("*")
        .eq("app_id", directAppId);

      expect(error).toBeNull();
      expect(data).toEqual([]); // Zero rows returned by Postgres RLS
    });

    it("Anonymous client reads an UNPUBLISHED app's dynamic table → 0 rows", async () => {
      const { data, error } = await directClient
        .from(dynamicTableName)
        .select("*");

      // PostgREST/Postgres evaluates RLS: private app tables return 0 rows to anonymous clients
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("Anonymous client write on dynamic per-app table is strictly denied by RLS (error 42501)", async () => {
      const { data, error } = await directClient
        .from(dynamicTableName)
        .insert({ title: "Injected directly into dynamic table" } as any)
        .select();

      // Postgres denies insert directly: error code 42501 (insufficient privilege)
      expect(error).not.toBeNull();
      expect(error?.code).toBe("42501");
      expect(data).toBeNull();
    });

    it("Positive Control: Anonymous client CAN read dynamic table when app is published", async () => {
      const serverDb = await createInsforgeServer();
      try {
        // Publish the app
        await serverDb
          .from("apps")
          .update({ published_config: { app: "Direct RLS Verified App", published: true } })
          .eq("id", directAppId);

        // Insert a test row via serverDb (service_role)
        await serverDb.from(dynamicTableName).insert({ title: "Public Record 1" });

        // Anonymous client reads dynamic table
        const { data, error } = await directClient
          .from(dynamicTableName)
          .select("title");

        expect(error).toBeNull();
        expect(data).toEqual([{ title: "Public Record 1" }]);
      } finally {
        // Revert published_config to null and cleanup row
        await serverDb.from(dynamicTableName).delete().neq("title", "");
        await serverDb.from("apps").update({ published_config: null }).eq("id", directAppId);
      }
    });
  });
});
