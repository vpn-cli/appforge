# Runbook: Database Hardening & Live Migration Deployment (Expand/Contract)

This runbook outlines the exact sequence to verify all security hardening changes in the isolated **TEST** database and safely apply the expand/contract migrations and repair routines to the **LIVE** production database (`upljqampxcmhqjszatrp`).

> [!NOTE]
> **Artifact Cleanup Completed**: The diagnostic and leftover artifact cleanup (`cleanup-live-artifacts.mjs`) has **already been performed manually**. No additional diagnostic table drops are required.

> [!IMPORTANT]
> **Zero-Downtime Expand/Contract Architecture (Single Session Requirement)**:
> - **Migration A (Expand Phase)**: Provisions the new 3-argument `execute_app_ddl(app_id, entity_name, fields)` with column addition and type validation, while preserving the legacy 2-argument `execute_app_ddl(app_id, query)` with strict safety guards. This ensures existing running production code continues functioning without disruption when Migration A is applied before code deployment.
> - **Application Deploy**: The new code exclusively uses the 3-argument `execute_app_ddl`.
> - **Migration B (Contract Phase)**: Permanently drops the legacy 2-argument `execute_app_ddl(text, text)` overload once the new application deployment is verified.
> - **CRITICAL: Single-Session Execution**: The entire pipeline (`Migration A → Code Deploy → Migration B`) **MUST be executed in one single session**. Currently running production instances continue invoking the legacy 2-argument overload until Vercel completes deployment of the new code. Never leave the system in an intermediate state, and never apply Migration B before the application deployment is healthy and ready.
> - **Safety Rule**: Never apply test-only migrations or run test suites against the live production database. Execute each step in the strict order specified below.

---

## Step 1: Apply Migration A & Teardown Helper to the TEST Project

In your **TEST** Supabase project dashboard (SQL Editor):

### 1A. Main Security Migration (Migration A - Expand Phase)
Copy and execute the entire contents of:
`sql/migrations/20261118_fix_published_apps_leak.sql`

**Key operations performed:**
1. **Default Privileges Hardening**:
   - `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;`
   - `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;`
   - `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;`
   (Applied for both `public` and `FOR ROLE postgres`).
2. **Drop Unused Views & Policies**:
   - `DROP VIEW IF EXISTS published_apps;`
   - PostgREST lockdown: `REVOKE ALL ON apps, app_schemas, app_* FROM anon, authenticated, PUBLIC;`
   - Drops all legacy `owner_policy_*` and `public_read_policy_*` policies.
3. **Structured `execute_app_ddl` (New 3-argument Overload)**:
   - Accepts `(app_id text, entity_name text, fields jsonb)`.
   - `SET search_path = public, pg_temp` on `SECURITY DEFINER`.
   - If table does not exist: creates table with whitelisted types (`TEXT`, `NUMERIC`, `BOOLEAN`, `TIMESTAMPTZ`) and enables RLS with 0 direct privileges.
   - If table exists: runs `ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I <type>` for each new field.
   - Rejects type changes on existing columns with a clear error (`Cannot change type of existing column...`).
   - Rejects unknown field types instead of defaulting to TEXT.
   - Restricts identifiers: entity <= 22 chars, column <= 63 chars.
4. **Preserve Legacy `execute_app_ddl` (2-argument Overload)**:
   - Pinned `SET search_path = public, pg_temp`.
   - Strictly forbids `DROP TABLE` and multi-statement queries.
5. **Drop `get_jwt_secret()`**.

### 1B. Test-Only Teardown Helper
Copy and execute the contents of:
`sql/test-only/20261118_test_teardown_helper.sql`

**Key operations performed:**
- Provisions `test_teardown_drop_table(target_table text)` RPC strictly for automated test teardown.
- `SET search_path = public, pg_temp`.
- Restricts identifier to valid namespaced table regex and safely quotes with `format('%I')`.

---

## Step 2: Run the Full Test Suite Against the TEST Project

Ensure `.env.test` is configured with test database credentials, then execute Vitest:

```bash
# Run the test suite:
npm test
```

### Verification Criteria:
- All test suites execute against the **TEST** database.
- Missing test secrets or pointing `TEST_SUPABASE_URL` to live immediately aborts with error (no fallback to production keys).
- All tests pass (0 failed, 0 skipped).

---

## Step 3: Apply Migration A to the LIVE Project

In your **LIVE** production Supabase project (`upljqampxcmhqjszatrp`) dashboard (SQL Editor):

Copy and execute the entire contents of:
`sql/migrations/20261118_fix_published_apps_leak.sql`

> [!CAUTION]
> **DO NOT** run `sql/test-only/20261118_test_teardown_helper.sql` on the live database. The test teardown helper must remain exclusively in the test project.

### Verification on Live:
- PostgREST direct access is locked down (`anon` and `authenticated` have 0 direct table privileges).
- Default privileges revoke future tables, sequences, and functions.
- The new 3-argument `execute_app_ddl` is active; the 2-argument `execute_app_ddl` remains available with safeguards for in-flight traffic.

---

## Pre-Deployment Audit: Vercel Environment Variables

Before triggering the application deploy in Step 4, audit your Vercel project environment settings. The new codebase enforces strict secret checking (no fallbacks to public keys).

### Vercel Environment Variables Checklist

| Variable Name | Environment / Target | Purpose & Usage | Status & Action Required |
|---|---|---|---|
| `NEXT_PUBLIC_INSFORGE_URL` | Production, Preview | Supabase project URL (`https://upljqampxcmhqjszatrp.supabase.co`) | ✅ **Present** in current production |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | Production, Preview | Supabase anonymous public key (used for client-side auth & unprivileged probes) | ✅ **Present** in current production |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview (Server only) | Supabase `service_role` secret key. Required for server database operations, RLS bypass on dynamic tenant tables, and invoking `execute_app_ddl` RPC. | ⚠️ **FLAG: CRITICAL & POTENTIALLY MISSING**<br>In earlier builds, `lib/insforge-server.ts` fell back to `NEXT_PUBLIC_INSFORGE_ANON_KEY`. In the hardened code, `SUPABASE_SERVICE_ROLE_KEY` is **strictly required**. If missing from Vercel, server database queries and schema syncs will throw fatal errors immediately on boot. Verify this secret is configured in Vercel before deploying. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production, Preview | Clerk publishable key (`pk_live_...` or `pk_test_...`) for client auth components | ✅ **Present** in current production |
| `CLERK_SECRET_KEY` | Production, Preview (Server only) | Clerk secret key (`sk_live_...` or `sk_test_...`) for server-side auth token verification in middleware & routes | ✅ **Present** in current production |
| `GROQ_API_KEY` | Production, Preview (Server only) | Groq API key (`gsk_...`) for primary Copilot streaming AST generation | ⚠️ **FLAG: CRITICAL & POTENTIALLY MISSING**<br>Added in Phase 2 for multi-provider streaming resilience. If missing from Vercel, Copilot generation will fail primary calls and immediately degrade to the Gemini fallback. Ensure a valid key is set. |
| `GEMINI_API_KEY` | Production, Preview (Server only) | Google Gemini API key (`AIzaSy...`) for Copilot fallback generation | ✅ **Present** in current production |
| `GEMINI_API_KEY_2` | Production, Preview (Server only) | Optional secondary Google Gemini key for rate limit rotation | ℹ️ Optional (Recommended for high traffic) |
| `GEMINI_API_KEY_3` | Production, Preview (Server only) | Optional tertiary Google Gemini key for rate limit rotation | ℹ️ Optional (Recommended for high traffic) |
| `UPSTASH_REDIS_REST_URL` | Production, Preview (Server only) | Upstash Redis REST URL for API rate limiting and semantic prompt caching | ✅ **Present** in current production |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview (Server only) | Upstash Redis REST bearer token | ✅ **Present** in current production |
| `NEXT_PUBLIC_SENTRY_DSN` | Production, Preview | Sentry DSN for exception tracking across client, edge, and server runtimes | ✅ **Present** in current production |
| `UPSTASH_KAFKA_REST_URL` | — | Upstash Kafka REST URL | ❌ **REMOVED** (Kafka has been completely removed from AppForge) |
| `UPSTASH_KAFKA_REST_USERNAME` | — | Upstash Kafka username | ❌ **REMOVED** (Kafka has been completely removed from AppForge) |
| `UPSTASH_KAFKA_REST_PASSWORD` | — | Upstash Kafka password | ❌ **REMOVED** (Kafka has been completely removed from AppForge) |
| `DEV_AUTH_BYPASS` | Development only | Local development auth bypass toggle | ⛔ **DO NOT SET IN VERCEL** (Hard-blocked when `NODE_ENV === "production"`; ensure it is not present in Vercel variables) |

---

## Step 4: Merge and Deploy Application Code

> [!WARNING]
> **Single Session Invariant**: Do NOT pause or end your deployment session here.
> Current production instances continue invoking the legacy 2-argument `execute_app_ddl(app_id, query)` function until Vercel completes deployment of the new code.
> If Migration B is applied before this step completes, production saves will fail immediately. Proceed directly from Step 3 to Step 4 and Step 6 in the same continuous session.

1. Merge the pull request (`feat/interview-hardening` branch) to `main`.
2. Allow Vercel (or your hosting platform) to build and deploy the production release.
3. Confirm deployment status is **Ready** in the Vercel dashboard.

---

## Step 5: Verify Saving a Schema in Production

1. Log in to the production application.
2. Open or create an application in the builder.
3. Save or update a configuration that defines entities and fields.
4. Verify the UI confirms: `Draft Saved: All configurations and AST properties are synchronized.`
5. Inspect application logs in Vercel to ensure the new 3-argument `execute_app_ddl` RPC was called successfully without errors.

---

## Step 6: Apply Migration B to the LIVE Project (Contract Phase)

> [!IMPORTANT]
> Apply Migration B immediately after Step 5 confirms healthy operation of the new code on live.
> Do NOT postpone Migration B to a future session, as leaving the legacy 2-argument overload exposed undermines the security perimeter established by Migration A.

In your **LIVE** Supabase dashboard (SQL Editor), copy and execute:
`sql/migrations/20261118_contract_legacy_ddl.sql`

**Key operation performed:**
- `DROP FUNCTION IF EXISTS execute_app_ddl(text, text);`
- Eliminates the legacy raw-query overload completely. The database now exclusively accepts structured DDL calls.

---

## Step 7: Run Repair Script on Live

Sync missing dynamic Postgres physical tables for legitimate user applications registered in `app_schemas`:

```bash
# 7A. Dry-run verification (safe check, 0 writes):
node scripts/repair-missing-tables.mjs

# 7B. Execute repair (provisions physical tables via structured execute_app_ddl):
node scripts/repair-missing-tables.mjs --execute
```

---

## Step 8: Final Live Sanity Check

1. Verify anonymous client cannot read or write to any application tables (returns 0 rows or 42501).
2. Verify legitimate users can load, view, and interact with published apps through server-mediated proxy routes (`/api/proxy/[appId]/[entity]`).
