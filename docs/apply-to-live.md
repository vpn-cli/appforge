# Runbook: Database Hardening & Live Migration Deployment

This runbook outlines the exact sequence to verify all security hardening changes in the isolated **TEST** database and safely apply the migration and cleanup routines to the **LIVE** production database (`upljqampxcmhqjszatrp`).

> [!IMPORTANT]
> **Safety Rule**: Never apply test-only migrations or run integration test suites against the live production database. Execute each step in the strict order specified below.

---

## Prerequisites & Architecture Verification

Ensure your environment separates test and production credentials:
- **Test Project**: Dedicated Supabase test instance (`TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_SUPABASE_SERVICE_ROLE_KEY`).
- **Live Project**: Production Supabase instance (`NEXT_PUBLIC_INSFORGE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

---

## Step 1: Apply Migrations to the TEST Project

In your **TEST** Supabase project dashboard (SQL Editor), apply the following migrations in order:

### 1A. Main Security Migration
Copy and execute the entire contents of:
`sql/migrations/20261118_fix_published_apps_leak.sql`

**Key operations performed:**
1. Default privileges revocation (`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated`).
2. Dropping unused `published_apps` view.
3. Full PostgREST lockdown (`REVOKE ALL ON apps, app_schemas, app_* FROM anon, authenticated, PUBLIC`).
4. Dropping unused `owner_policy_*` and `public_read_policy_*` policies across all existing tables.
5. Deploying the structured `execute_app_ddl(app_id text, entity_name text, fields jsonb)` RPC (no raw query string, 22-char entity length limit, 63-char column length limit, format(`%I`), and column type whitelist).
6. Permanently dropping `get_jwt_secret()`.

### 1B. Test-Only Teardown Helper
Copy and execute the contents of:
`sql/test-only/20261118_test_teardown_helper.sql`

**Key operations performed:**
- Provisions `test_teardown_drop_table(target_table text)` RPC strictly for automated test cleanup.
- Enforces strict regex validation `^app_[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}_[a-zA-Z0-9_]{1,22}$` and quotes identifiers safely with `format('%I')`.

---

## Step 2: Run the Full Test Suite Against the TEST Project

Set your test environment variables (in `.env.test` or temporary shell session) and execute Vitest:

```bash
# Set your test project secrets:
$env:TEST_SUPABASE_URL="https://<your-test-project>.supabase.co"
$env:TEST_SUPABASE_ANON_KEY="<test-anon-key>"
$env:TEST_SUPABASE_SERVICE_ROLE_KEY="<test-service-role-key>"

# Run the test suite:
npm test
```

### Verification Criteria:
- **Total Test Files**: 3 passed (`tests/app-access.test.ts`, `tests/copilot-pipeline.test.ts`, `tests/cross-tenant-hardening.test.ts`).
- **Total Tests**: Exactly **59 tests executed, 59 passed, 0 skipped, 0 failed**.
- **No Production Access**: Verification confirms 0 queries touched `upljqampxcmhqjszatrp`.

---

## Step 3: Apply the Main Migration to the LIVE Project

In your **LIVE** production Supabase project (`upljqampxcmhqjszatrp`) dashboard (SQL Editor):

Copy and execute the entire contents of:
`sql/migrations/20261118_fix_published_apps_leak.sql`

> [!CAUTION]
> **DO NOT** run `sql/test-only/20261118_test_teardown_helper.sql` on the live database. The test teardown helper must remain exclusively in the test project.

### What this accomplishes on Live:
- Completely locks down PostgREST direct table access from `anon` and `authenticated`.
- All future tables start 100% private via `ALTER DEFAULT PRIVILEGES`.
- Removes the `published_apps` view and all unused direct owner policies.
- Drops legacy raw-query `execute_app_ddl(text, text)` and replaces it with structured `execute_app_ddl(text, text, jsonb)` with format(`%I`).
- Drops `get_jwt_secret()`.

---

## Step 4: Drop Diagnostic & Leftover Tables on Live

Run the cleanup utility in dry-run mode first, verify the target list, then execute:

```bash
# 4A. Dry-run verification (safe default, 0 writes):
node scripts/cleanup-live-artifacts.mjs

# 4B. Execute drops against live:
node scripts/cleanup-live-artifacts.mjs --execute --confirm-drop-live-artifacts
```

### Objects Cleaned Up:
- **Diagnostic Tables (5)**: `app_..._policies_check_del`, `app_..._pgtables_check_del`, `app_test_jwt_probe`, `app_test_123_items`, `app_test_items`.
- **CI / Test Leftovers (12)**: Orphaned dynamic tables created during prior test runs.
- **Views & Functions**: `published_apps`, `get_jwt_secret()`.

*(Alternatively, copy and paste the SQL script printed during Step 4A directly into the Supabase SQL Editor).*

---

## Step 5: Run Repair Script on Live

Sync missing dynamic Postgres physical tables for legitimate user applications registered in `app_schemas`:

```bash
# 5A. Dry-run verification (0 writes):
node scripts/repair-missing-tables.mjs

# 5B. Execute repair (provisions physical tables via structured execute_app_ddl):
node scripts/repair-missing-tables.mjs --execute
```

---

## Step 6: Final Live Sanity Check

Verify that anonymous access is completely locked down and user applications continue to function seamlessly:

```bash
# Check that anon cannot query diagnostic tables (must return 404 or empty):
node scripts/cleanup-live-artifacts.mjs
```

Verify in the browser:
- Log in via Clerk on `http://localhost:3000` or production domain.
- Verify published apps load properly through server-mediated proxy endpoints (`/api/proxy/[appId]/[entity]`).
