# Post-Deployment Go-Live Smoke Test Checklist

This checklist adapts Step 5 and Step 8 of the database hardening deployment runbook (`docs/apply-to-live.md`) into an operational verification checklist.

> [!IMPORTANT]
> Execute these verification steps immediately after application code deployment to production and **BEFORE** executing Migration B (contract phase).
> Published app URLs must be verified manually: do not query the live database to look up URLs.

---

## 1. Pre-Deployment Configuration Audit
- [ ] `SUPABASE_SERVICE_ROLE_KEY` verified present in Vercel Production Environment Variables.
- [ ] `NEXT_PUBLIC_INSFORGE_URL` verified present in Vercel Production (`https://upljqampxcmhqjszatrp.supabase.co`).
- [ ] `NEXT_PUBLIC_INSFORGE_ANON_KEY` verified present in Vercel Production.
- [ ] `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` verified present in Vercel Production.
- [ ] `GROQ_API_KEY` verified present in Vercel Production.
- [ ] `GEMINI_API_KEY` verified present in Vercel Production.
- [ ] `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` verified present in Vercel Production.
- [ ] `DEV_AUTH_BYPASS` confirmed **NOT** set in Vercel Production.

---

## 2. End-to-End Application Workflow Smoke Test
- [ ] **Step 1: Template Provisioning**:
  - Log in to production AppForge as an authenticated user.
  - Create a new application from a template (e.g. Employee Directory or CRM).
  - Confirm the builder UI loads with its dynamic Postgres physical table provisioned.
- [ ] **Step 2: Schema Addition (3-argument DDL)**:
  - In the builder, add a new field to an existing entity and click Save.
  - Confirm `Draft Saved` notification appears.
  - Verify Vercel runtime logs confirm `execute_app_ddl` 3-argument RPC executed without errors.
- [ ] **Step 3: Record Insertion & Data Persistence**:
  - Insert a record into that entity, including a value for the newly created field.
  - Confirm the record persists and renders back cleanly in the table/preview.
- [ ] **Step 4: Application Publication**:
  - Click **Publish**.
  - Confirm publication succeeds without errors.
- [ ] **Step 5: Unauthenticated / Logged-Out Public Read**:
  - Open the published application URL in an incognito / private browser window (signed out):
    - Target URL: `[TODO: published app URL]`
  - Confirm the application renders the complete UI and displays its persisted data rows via `GET /api/proxy/[appId]/[entity]`.
  - Confirm no `401`, `404`, or `500` console errors occur.
  - Verify non-owner mutations are rejected (cannot edit or delete from the public view).

---

## 3. Post-Migration B & Table Repair Verification
- [ ] Apply Migration B (`sql/migrations/20261118_contract_legacy_ddl.sql`) on the live database.
- [ ] Run live missing table repair:
  - Dry-run: `node scripts/repair-missing-tables.mjs`
  - Execute: `node scripts/repair-missing-tables.mjs --execute`
- [ ] **Step 8 Final Live Sanity Check**:
  - Verify anonymous client cannot read or write directly to core `apps` or `app_schemas` tables (returns `42501 Insufficient Privilege`).
  - Verify legitimate users can load, view, and interact with published apps through server-mediated proxy routes (`/api/proxy/[appId]/[entity]`).
  - Clean up test apps created during Step 2.
