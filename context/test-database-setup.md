# Test Database Architecture & Isolation

## Overview

AppForge maintains strict separation between development, testing, and production runtime environments to guarantee that automated test suites and benchmarks never mutate, lock, or corrupt production data.

---

## Environment Separation

| Environment | Purpose | Target Database | Credentials Source |
| :--- | :--- | :--- | :--- |
| **Production** | Live Demo (`appforge-studios.vercel.app`) | `upljqampxcmhqjszatrp` (Live Supabase Project) | Vercel Environment Variables |
| **Development** | Local Developer iteration | Local Supabase CLI container OR Isolated Dev Project | `.env.local` |
| **Test & CI** | Automated Vitest suite & GitHub Actions CI | Dedicated Test Database (e.g. `TEST_SUPABASE_URL`) | GitHub Secrets & `.env.test` |

---

## Configuration Variables

When running `npm test` locally or in CI, the test runner prioritizes test-specific secrets over default platform keys:

```bash
# Test Environment Overrides (prioritized in CI)
TEST_SUPABASE_URL="https://<your-test-project>.supabase.co"
TEST_SUPABASE_ANON_KEY="<test-anon-key>"
TEST_SUPABASE_SERVICE_ROLE_KEY="<test-service-role-key>"
CLERK_SECRET_KEY="<clerk-secret-key>"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<clerk-publishable-key>"
```

### Local Setup via Supabase CLI
To run a completely hermetic local database on developer machines with Docker installed:

1. Start local Supabase containers:
   ```bash
   npx supabase start
   ```
2. Apply schema migrations:
   ```bash
   npx supabase db push
   ```
3. Set in `.env.test.local`:
   ```bash
   NEXT_PUBLIC_INSFORGE_URL="http://127.0.0.1:54321"
   NEXT_PUBLIC_INSFORGE_ANON_KEY="<local-anon-key>"
   SUPABASE_SERVICE_ROLE_KEY="<local-service-role-key>"
   ```
4. Run tests:
   ```bash
   npm test
   ```

---

## GitHub Actions CI Pipeline

In `.github/workflows/production.yml`, the `test-suite` job binds to GitHub Actions secrets:
- If `TEST_SUPABASE_URL` is set in repository secrets, CI runs against the dedicated test database.
- The test suite executes real queries (creating temporary test apps, validating cross-tenant boundaries, and cleaning up test records in `afterAll`).
- Cross-tenant tests assert that user B receives 404 / 401 on user A's apps, verifying database integrity.
