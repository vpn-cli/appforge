# Runbook: Database Hardening & Live Migration Deployment (Expand/Contract)

This runbook outlines the exact sequence to verify all security hardening changes in the isolated **TEST** database and safely apply the expand/contract migrations and repair routines to the **LIVE** production database (`upljqampxcmhqjszatrp`).

> [!NOTE]
> **Artifact Cleanup Completed**: The diagnostic and leftover artifact cleanup (`cleanup-live-artifacts.mjs`) has **already been performed manually**. No additional diagnostic table drops are required.

> [!IMPORTANT]
> **Zero-Downtime Expand/Contract Architecture (Single Session Requirement)**:
> - **Execution Pipeline**:
>   `check-live-configs --live` → `Vercel env` → `pg_dump backup` → `Migration A` → `merge to master (Vercel deploys)` → `repair-missing-tables DRY-RUN` → `review output` → `repair-missing-tables EXECUTE` → `post-repair data curation` → `smoke test` → `Migration B` → `anon curl /rest/v1/apps → permission error`.
> - **Migration A (Expand Phase)**: Provisions the new 3-argument `execute_app_ddl(app_id, entity_name, fields)` with column addition and type validation, while preserving the legacy 2-argument `execute_app_ddl(app_id, query)` with strict safety guards. This ensures existing running production code continues functioning without disruption when Migration A is applied before code deployment.
> - **Application Deploy**: The new code exclusively uses the 3-argument `execute_app_ddl`.
> - **Table Repair**: Syncs missing dynamic Postgres tables for legitimate apps in `app_schemas` so published apps don't 503.
> - **Migration B (Contract Phase)**: Permanently drops the legacy 2-argument `execute_app_ddl(text, text)` overload once the new application deployment and smoke test are verified.
> - **CRITICAL: Single-Session Execution**: The entire pipeline (`Migration A → Code Deploy → Table Repair → Smoke Test → Migration B`) **MUST be executed in one single session**. Currently running production instances continue invoking the legacy 2-argument overload until Vercel completes deployment of the new code. Never leave the system in an intermediate state, and never apply Migration B before the application deployment and smoke tests are verified healthy.
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
   - PostgREST lockdown: `REVOKE ALL ON apps, app_schemas, validation_logs (if present), app_* FROM anon, authenticated, PUBLIC;`
   - Locks down `validation_logs` (if present): enables RLS, revokes all privileges from `anon, authenticated, PUBLIC`, and drops the legacy permissive `"Allow Nextjs Server Actions on validation_logs"` (`USING (true)`) policy.
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

## Step 3: Audit Live App Configurations Against Strict Schemas (`check-live-configs --live`)

Before running Migration A or touching the live production database, audit all existing application configurations to confirm compatibility with the strict `.strict()` AST schemas:

```bash
# Run compatibility check against live production database (read-only transaction, 0 writes):
node scripts/check-live-configs.mjs --live
```

> [!CAUTION]
> **If ANY apps are reported as INVALID**:
> 1. Immediately take a fresh logical backup via Docker `pg_dump` in Windows PowerShell:
>    ```powershell
>    # Ensure backups directory exists
>    New-Item -ItemType Directory -Force -Path "backups" | Out-Null
>    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
>
>    # Windows PowerShell Docker pg_dump:
>    docker run --rm -v "${PWD}/backups:/backups" postgres:16 pg_dump "$env:LIVE_DATABASE_URL" `
>      --table=apps `
>      --format=custom `
>      --no-owner `
>      --no-privileges `
>      --file="/backups/live-apps-pre-strip-$timestamp.dump"
>    ```
> 2. Run the key stripping migration script in dry-run mode (read-only transaction, 0 writes) to inspect what keys would be stripped:
>    ```bash
>    node scripts/migrate-strip-invalid-keys.mjs --live
>    ```
> 3. **STOP AND WAIT FOR CONFIRMATION**: Do NOT apply the stripping migration or proceed with Migration A or the merge. Wait for user review and explicit approval before taking any further action.

---

## Step 4: Pre-Deployment Audit: Vercel Environment Variables (`Vercel env`)

Before executing Migration A or deploying code, audit your hosting environment settings. The hardened codebase enforces strict secret checking (no fallbacks to public keys).

> [!CAUTION]
> **CRITICAL PRE-REQUISITE**: Before executing Migration A on live, you MUST confirm:
> 1. `SUPABASE_SERVICE_ROLE_KEY` exists in Vercel Production environment variables (`Project Settings` → `Environment Variables`).
> 2. The deployed application code never falls back to the anon key (`NEXT_PUBLIC_INSFORGE_ANON_KEY`).
> 
> **Why this pre-check is non-negotiable:**
> Migration A immediately executes `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;` to eliminate public table leaks. If the live production deployment were ever to fall back to the anon key, all server database queries would immediately fail with permission denied errors, causing a catastrophic production outage.
> 
> In this release, the server client (`lib/insforge-server.ts`) and startup instrumentation (`instrumentation.ts`) have permanently eliminated the anon-key fallback: any missing service role key will fail loudly at startup. Verify that `SUPABASE_SERVICE_ROLE_KEY` is present in Vercel Production before running Migration A.

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

## Step 5: Mandatory Logical Backup (`pg_dump backup`) Before Migration A on Live

Before running any DDL or privilege changes on the live database (`upljqampxcmhqjszatrp`), take a full logical backup via `pg_dump` using the live pooler session-mode connection string (port `5432`, supplied via environment variable — never commit or print credentials):

```bash
# Export a timestamped custom-format backup (schema + data) of the public schema
pg_dump "$LIVE_DATABASE_URL" \
  --schema=public \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="backups/live-pre-migration-a-$(date +%Y%m%d-%H%M%S).dump"

# Verify the backup file exists and is readable before proceeding
pg_restore --list backups/live-pre-migration-a-*.dump | head -n 20
```

> [!IMPORTANT]
> Store the `.dump` file outside the git repository (or in a gitignored directory) and verify `pg_restore --list` succeeds before executing Migration A.

---

## Step 6: Apply Migration A to the LIVE Project (Expand Phase)

In your **LIVE** production Supabase project (`upljqampxcmhqjszatrp`) dashboard (SQL Editor):

Copy and execute the entire contents of:
`sql/migrations/20261118_fix_published_apps_leak.sql`

> [!CAUTION]
> **DO NOT** run `sql/test-only/20261118_test_teardown_helper.sql` on the live database. The test teardown helper must remain exclusively in the test project.

### Verification on Live:
- PostgREST direct access is locked down (`anon` and `authenticated` have 0 direct table privileges across `apps`, `app_schemas`, `validation_logs`, and all `app_*` tables, with no permissive `USING (true)` policies remaining).
- Default privileges revoke future tables, sequences, and functions for `postgres`.
- The new 3-argument `execute_app_ddl` is active; the 2-argument `execute_app_ddl` remains available with safeguards for in-flight traffic.

---

## Step 7: Merge and Deploy Application Code (`merge to master (Vercel deploys)`)

> [!WARNING]
> **Single Session Invariant**: Do NOT pause or end your deployment session here.
> Current production instances continue invoking the legacy 2-argument `execute_app_ddl(app_id, query)` function until Vercel completes deployment of the new code.
> If Migration B is applied before this step completes, production saves will fail immediately. Proceed directly through Table Repair, Smoke Test, and Migration B in the same continuous session.

1. Merge the pull request (`feat/landing-redesign` branch) to `master`.
2. Allow Vercel (or your hosting platform) to build and deploy the production release.
3. Confirm deployment status is **Ready** in the Vercel dashboard.

---

## Step 8: Repair Missing Dynamic Tables on Live: Dry-Run Verification (`repair-missing-tables DRY-RUN`)

> [!NOTE]
> **Verified Production Baseline (Nov 21)**: LIVE has 0 per-app data tables (public schema has only `apps`=13, `app_schemas`=7, `validation_logs`=0).
> The proxy returns 503 for missing tables, so existing published apps render error boxes before table repair.
> Running `repair-missing-tables.mjs` before the smoke test provisions the physical tables so existing apps render cleanly with empty tables instead of error boxes. The repaired empty tables are completely harmless to the old code.

Run the repair script in dry-run mode (safe check, 0 writes):

```bash
node scripts/repair-missing-tables.mjs
```

---

## Step 9: Review Repair Dry-Run Output (`review output`)

Review the dry-run console output carefully:
1. Verify each app and entity to be provisioned matches expectations from `app_schemas`.
2. Confirm the exact `execute_app_ddl` payloads (columns, types) match registered schema definitions.
3. Verify zero errors or unexpected table definitions are reported.

---

## Step 10: Execute Table Repair on Live (`repair-missing-tables EXECUTE`)

Once the dry-run output is reviewed and confirmed, execute the repair migration against live:

```bash
node scripts/repair-missing-tables.mjs --execute
```

This provisions the missing physical tables via structured `execute_app_ddl`.

---

## Step 11: Post-Repair Live Data Curation

Following table repair, curate the existing live applications:
1. **Rename or Unpublish "fisrt"**:
   - In the production dashboard/builder as the owner, open the app named `fisrt` (`/apps/6b0e3994-e4c4-4c0a-a8c5-5b705e0885aa`).
   - Either rename the app to a proper, descriptive name or click **Unpublish** if it is a disposable test app.
2. **Add Sample Rows to "Analytics CRM"**:
   - Open `/apps/df557309-95e1-4b71-be92-759bf3ff33fc` ("Analytics CRM") in the builder UI as the owner.
   - Add a few realistic sample records via the preview/builder interface and save/publish.
   - This ensures the public view displays populated data rows rather than an empty table to external visitors.

---

## Step 12: Post-Deploy Smoke Test in Production (`smoke test`)

Execute the production smoke test protocol (see [smoke-test.md](file:///d:/Projects/appforge/docs/smoke-test.md)) against the live deployment **before** running Migration B:

1. **Verify existing published apps**: Open the two existing live published applications in an incognito/private browser window (signed out):
   - **fisrt**: `/apps/6b0e3994-e4c4-4c0a-a8c5-5b705e0885aa`
   - **Analytics CRM**: `/apps/df557309-95e1-4b71-be92-759bf3ff33fc`
   Expected after repair: both render logged-out with **EMPTY tables and no error boxes** (verified fact Nov 21: LIVE had 0 per-app data tables before; repair provisioned the empty physical tables so proxy returns 200 with `[]` without error boxes). After curation in Step 11, Analytics CRM will render populated data rows, and `fisrt` will be renamed or unpublished.
2. **Create an app from a template**: Log in to production, create a new app from a template (e.g., Employee Directory), and confirm the builder opens with its physical table provisioned.
3. **Add a field**: In the builder, add a new field to an existing entity and save. Confirm `Draft Saved` succeeds and inspect Vercel logs to verify the 3-argument `execute_app_ddl` RPC succeeded without errors.
4. **Insert a row**: Insert a record into that entity (including a value for the newly added field) and verify it persists and renders back cleanly.
5. **Publish**: Click **Publish** and confirm the app publishes without errors.
6. **View the published app logged out**: Open the newly published app (`/apps/<newAppId>`) in an incognito/private browser window (signed out) and confirm the published application renders cleanly and **logged-out view shows DATA rows** (including the row inserted in step 4 via `GET /api/proxy/<appId>/<entity>`), with zero 401/404/500 errors. Note: The requirement to display populated DATA rows applies specifically to this NEW app created, filled, and published during the smoke test.

> [!CAUTION]
> **Rollback Procedure**: If any smoke test step fails, **STOP IMMEDIATELY before applying Migration B**.
> Perform a **Vercel Instant Rollback** in the Vercel dashboard to revert to the previous working deployment.
> *(Note: The repaired empty tables in Postgres are completely harmless to the old code).*
> Do NOT proceed to Migration B until all issues are investigated and resolved.

*(Clean up the smoke-test app after completing Step 14.)*

---

## Step 13: Apply Migration B to the LIVE Project (Contract Phase)

> [!IMPORTANT]
> Apply Migration B immediately after Step 12 confirms healthy operation of the new code on live.
> Do NOT postpone Migration B to a future session, as leaving the legacy 2-argument overload exposed undermines the security perimeter established by Migration A.

In your **LIVE** Supabase dashboard (SQL Editor), copy and execute:
`sql/migrations/20261118_contract_legacy_ddl.sql`

**Key operation performed:**
- `DROP FUNCTION IF EXISTS execute_app_ddl(text, text);`
- Permanently drops the legacy raw-query overload completely. The database now exclusively accepts structured DDL calls.

---

## Step 14: Final Live Sanity Check & Anonymous Lockdown (`anon curl /rest/v1/apps → permission error`)

1. **Verify Anonymous Client Access Denied via PostgREST curl (Explicit LIVE Target)**:
   Execute curl against PostgREST explicitly targeting the LIVE Supabase production host (`https://upljqampxcmhqjszatrp.supabase.co`) with a LIVE anon key provided at runtime (do **not** use `$NEXT_PUBLIC_INSFORGE_URL` or `.env.local` which points to the TEST project):
   ```bash
   # Supply the LIVE anon key at runtime (do NOT commit secrets to git):
   LIVE_ANON_KEY="<paste-live-anon-key-here>"

   curl -s -i -v \
     -H "apikey: $LIVE_ANON_KEY" \
     -H "Authorization: Bearer $LIVE_ANON_KEY" \
     "https://upljqampxcmhqjszatrp.supabase.co/rest/v1/apps"
   ```
   - **Confirm Host in Output**: Explicitly confirm the verbose curl output shows connection to `upljqampxcmhqjszatrp.supabase.co` before trusting the result.
   - **Confirm Permission Error**: Verify the response returns an HTTP permission error (`401 Unauthorized` or `403 Forbidden` / PostgreSQL code `42501` insufficient privilege). Direct access to `apps`, `app_schemas`, `validation_logs`, and dynamic tables is strictly forbidden for the anonymous role.

2. **Verify Server Proxy Routes**:
   Verify legitimate users and public visitors can load and view published apps through server-mediated proxy routes (`/api/proxy/[appId]/[entity]`).
