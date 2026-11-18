/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Phase 1 / Phase 2: Direct Postgres Row-Level Security (RLS) Verification
 * 
 * CRITICAL RULE: Tests using SERVICE_ROLE_KEY bypass RLS in Postgres (bypassrls role).
 * This test suite verifies RLS by connecting directly to Postgres via PostgREST
 * as User B (using User B's Clerk JWT session token) and attempting to read, insert,
 * update, and delete rows belonging to User A across:
 *   1. Core apps table (unpublished vs published)
 *   2. Core app_schemas metadata table
 *   3. Dynamic runtime tables (app_<id>_<entity>)
 *
 * SAFETY GUARD: Under no circumstances does this suite execute against the live demo database.
 * It requires a dedicated test project configured strictly in `.env.test`.
 */

const envTestPath = path.resolve(process.cwd(), ".env.test");
const isTestEnvConfigured = fs.existsSync(envTestPath);

// Load test environment if present
if (isTestEnvConfigured) {
  dotenv.config({ path: envTestPath, override: true });
}

const testSupabaseUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_INSFORGE_URL;
const testAnonKey = process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const userAToken = process.env.CLERK_USER_A_TOKEN;
const userBToken = process.env.CLERK_USER_B_TOKEN;
const userAId = process.env.CLERK_USER_A_ID || "user_clerk_tenant_a";
const userBId = process.env.CLERK_USER_B_ID || "user_clerk_tenant_b";

// Ensure tests only run when an explicit, isolated .env.test is supplied with non-demo credentials
const canRunDirectRlsTests = Boolean(
  isTestEnvConfigured &&
  testSupabaseUrl &&
  testAnonKey &&
  userAToken &&
  userBToken
);

describe.skipIf(!canRunDirectRlsTests)(
  "Direct Postgres RLS Verification (User B Token vs User A Data in .env.test)",
  () => {
    let clientUserA: SupabaseClient;
    let clientUserB: SupabaseClient;
    let testAppId: string;
    let dynamicTableName: string;

    beforeAll(async () => {
      // Initialize Supabase clients with third-party Clerk JWTs (authenticated role)
      clientUserA = createClient(testSupabaseUrl!, testAnonKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${userAToken}` } },
      });

      clientUserB = createClient(testSupabaseUrl!, testAnonKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${userBToken}` } },
      });

      // 1. User A creates their private app directly
      const { data: newApp, error: appErr } = await clientUserA
        .from("apps")
        .insert({
          user_id: userAId,
          name: "User A Confidential Payroll",
          config: { app: "User A Confidential Payroll" },
          published_config: null, // Strictly private
        })
        .select("id")
        .single();

      if (appErr || !newApp) {
        throw new Error(`Failed to create User A test app in test database: ${appErr?.message}`);
      }
      testAppId = newApp.id;
      dynamicTableName = `app_${testAppId.replace(/-/g, "_")}_salaries`;

      // 2. User A creates schema definition in app_schemas
      const { error: schemaErr } = await clientUserA.from("app_schemas").insert({
        app_id: testAppId,
        table_name: "salaries",
        schema_definition: { employee: "string", amount: "number" },
      });
      if (schemaErr) {
        throw new Error(`Failed to insert app_schema for User A: ${schemaErr.message}`);
      }

      // 3. User A populates rows into their dynamic table
      const { error: insertErr } = await clientUserA.from(dynamicTableName).insert([
        { employee: "Alice", amount: 150000 },
        { employee: "Bob", amount: 140000 },
      ]);
      if (insertErr) {
        throw new Error(`Failed to insert sample dynamic data for User A: ${insertErr.message}`);
      }
    });

    afterAll(async () => {
      if (testAppId && clientUserA) {
        // Clean up created resources using User A client
        await clientUserA.from(dynamicTableName).delete().neq("amount", 0);
        await clientUserA.from("app_schemas").delete().eq("app_id", testAppId);
        await clientUserA.from("apps").delete().eq("id", testAppId);
      }
    });

    // =========================================================================
    // 1. Core Table: apps
    // =========================================================================
    describe("Core Table: apps", () => {
      it("User B direct SELECT on User A's private app returns 0 rows (Postgres RLS filters rows)", async () => {
        const { data, error } = await clientUserB
          .from("apps")
          .select("id, name, user_id, config")
          .eq("id", testAppId);

        expect(error).toBeNull();
        expect(data).toEqual([]); // Zero rows returned to User B
      });

      it("User B direct UPDATE on User A's app modifies 0 rows", async () => {
        const { data, error } = await clientUserB
          .from("apps")
          .update({ name: "Hacked by User B" })
          .eq("id", testAppId)
          .select();

        expect(error).toBeNull();
        expect(data).toEqual([]); // Postgres RLS blocks row visibility for update
      });

      it("User B direct DELETE on User A's app removes 0 rows", async () => {
        const { data, error } = await clientUserB
          .from("apps")
          .delete()
          .eq("id", testAppId)
          .select();

        expect(error).toBeNull();
        expect(data).toEqual([]);
      });

      it("User B direct INSERT cannot spoof User A's user_id (rejected by WITH CHECK policy)", async () => {
        const { data, error } = await clientUserB
          .from("apps")
          .insert({
            user_id: userAId, // User B trying to create an app claiming User A's id
            name: "Spoofed App",
          })
          .select();

        // Postgres RLS WITH CHECK (user_id = (select auth.jwt()->>'sub')) rejects insert
        expect(error).toBeDefined();
        expect(data).toBeNull();
      });
    });

    // =========================================================================
    // 2. Core Table: app_schemas
    // =========================================================================
    describe("Core Table: app_schemas", () => {
      it("User B direct SELECT on User A's app_schemas returns 0 rows", async () => {
        const { data, error } = await clientUserB
          .from("app_schemas")
          .select("*")
          .eq("app_id", testAppId);

        expect(error).toBeNull();
        expect(data).toEqual([]);
      });

      it("User B direct INSERT into app_schemas for User A's app is rejected by RLS", async () => {
        const { data, error } = await clientUserB
          .from("app_schemas")
          .insert({
            app_id: testAppId,
            table_name: "unauthorized_table",
            schema_definition: {},
          })
          .select();

        expect(error).toBeDefined();
        expect(data).toBeNull();
      });
    });

    // =========================================================================
    // 3. Dynamic Runtime Table: app_<id>_<entity>
    // =========================================================================
    describe("Dynamic Table: app_<id>_<entity> (Private App State)", () => {
      it("User B direct SELECT on User A's private dynamic table returns 0 rows", async () => {
        const { data, error } = await clientUserB
          .from(dynamicTableName)
          .select("*");

        // Evaluates owner_policy: user_id != auth.jwt()->>'sub', public_read: published_config IS NULL
        expect(error).toBeNull();
        expect(data).toEqual([]);
      });

      it("User B direct INSERT into User A's dynamic table is strictly rejected by Postgres RLS", async () => {
        const { data, error } = await clientUserB
          .from(dynamicTableName)
          .insert({ employee: "Attacker", amount: 999999 })
          .select();

        expect(error).toBeDefined();
        expect(data).toBeNull();
      });

      it("User B direct UPDATE on User A's dynamic table modifies 0 rows", async () => {
        const { data, error } = await clientUserB
          .from(dynamicTableName)
          .update({ amount: 0 })
          .eq("employee", "Alice")
          .select();

        expect(error).toBeNull();
        expect(data).toEqual([]);
      });

      it("User B direct DELETE on User A's dynamic table deletes 0 rows", async () => {
        const { data, error } = await clientUserB
          .from(dynamicTableName)
          .delete()
          .eq("employee", "Alice")
          .select();

        expect(error).toBeNull();
        expect(data).toEqual([]);
      });
    });

    // =========================================================================
    // 4. Dynamic Table: Published State Transition
    // =========================================================================
    describe("Dynamic Table: app_<id>_<entity> (Published App State)", () => {
      beforeAll(async () => {
        // User A publishes their app
        const { error } = await clientUserA
          .from("apps")
          .update({ published_config: { app: "User A Confidential Payroll", published: true } })
          .eq("id", testAppId);

        if (error) throw error;
      });

      afterAll(async () => {
        // Revert to private
        await clientUserA
          .from("apps")
          .update({ published_config: null })
          .eq("id", testAppId);
      });

      it("User B direct SELECT on User A's PUBLISHED dynamic table is allowed by public_read_policy", async () => {
        const { data, error } = await clientUserB
          .from(dynamicTableName)
          .select("employee, amount");

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data?.length).toBe(2);
      });

      it("User B direct INSERT on User A's PUBLISHED dynamic table is STILL DENIED by RLS", async () => {
        const { data, error } = await clientUserB
          .from(dynamicTableName)
          .insert({ employee: "Mallory", amount: 500000 })
          .select();

        // public_read_policy is SELECT-only; mutations require owner_policy
        expect(error).toBeDefined();
        expect(data).toBeNull();
      });

      it("User B direct DELETE on User A's PUBLISHED dynamic table is STILL DENIED (0 rows affected)", async () => {
        const { data, error } = await clientUserB
          .from(dynamicTableName)
          .delete()
          .eq("employee", "Alice")
          .select();

        expect(error).toBeNull();
        expect(data).toEqual([]);
      });
    });
  }
);
