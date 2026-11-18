# Runbook: Database Hardening & Live Migration Deployment (Expand/Contract)

This runbook outlines the exact sequence to verify all security hardening changes in the isolated **TEST** database and safely apply the expand/contract migrations and repair routines to the **LIVE** production database (`upljqampxcmhqjszatrp`).

> [!NOTE]
> **Artifact Cleanup Completed**: The diagnostic and leftover artifact cleanup (`cleanup-live-artifacts.mjs`) has **already been performed manually**. No additional diagnostic table drops are required.

> [!IMPORTANT]
> **Zero-Downtime Expand/Contract Architecture**:
> - **Migration A (Expand Phase)**: Provisions the new 3-argument `execute_app_ddl(app_id, entity_name, fields)` with column addition and type validation, while preserving the legacy 2-argument `execute_app_ddl(app_id, query)` with strict safety guards. This ensures existing application code continues functioning without disruption when Migration A is applied before code deployment.
> - **Application Deploy**: The new code exclusively uses the 3-argument `execute_app_ddl`.
> - **Migration B (Contract Phase)**: Permanently drops the legacy 2-argument `execute_app_ddl(text, text)` overload once the new application deployment is verified.
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

## Step 4: Merge and Deploy Application Code

1. Merge the pull request (`feat/interview-hardening` branch) to `main`.
2. Allow Vercel (or your hosting platform) to build and deploy the production release.
3. Confirm deployment status is **Ready**.

---

## Step 5: Verify Saving a Schema in Production

1. Log in to the production application.
2. Open or create an application in the builder.
3. Save or update a configuration that defines entities and fields.
4. Verify the UI confirms: `Draft Saved: All configurations and AST properties are synchronized.`
5. Inspect application logs to ensure the new 3-argument `execute_app_ddl` RPC was called successfully without errors.

---

## Step 6: Apply Migration B to the LIVE Project (Contract Phase)

Once production operation is verified on the new application code:

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
