# Decision Record: Server-Side Service Role Client vs. Clerk JWT RLS

## Context & Problem
AppForge uses Clerk for user authentication and Supabase PostgreSQL for multi-tenant data storage. There are two primary architectural patterns for enforcing multi-tenant isolation in Supabase:
1. **Direct Supabase RLS via Clerk Third-Party JWTs**: Passing Clerk session JWTs directly to Supabase client-side or server-side, relying on Postgres `auth.jwt()` claims in row-level security policies.
2. **Server-Side Service Role with Application-Layer Authorization**: Locking down direct access completely for unauthenticated and client roles (`anon` and `authenticated`), and mediating all database queries through Next.js Server Actions using the Supabase `service_role` key, guarded by Clerk `auth()` and `authorizeAppAccess()`.

## Decision
- AppForge exclusively employs **Server-Side Service Role with Application-Layer Authorization**.
- Direct client-side access to Supabase is disabled: `anon` and `authenticated` PostgreSQL roles have direct privileges revoked across `apps`, `app_schemas`, and dynamic tenant tables (`public.app_*`), resulting in PostgreSQL error `42501 Insufficient Privilege`.
- Dynamic tenant tables (`app_<id>_<entity>`) are provisioned via the `execute_app_ddl` RPC invoked by server actions under the service role.

## Rationale
1. **Dynamic DDL & Schema Provisioning**: AppForge creates physical PostgreSQL tables on the fly as users design apps. DDL operations (`CREATE TABLE`, `ALTER TABLE ADD COLUMN`) require elevated privileges that cannot be executed under end-user database roles.
2. **Simplified Threat Surface**: Disabling direct client access eliminates client-side token spoofing, accidental exposure of Supabase endpoints, and bypass vulnerabilities in client SDKs.
3. **Defense in Depth**: All mutations are validated and sanitized in Next.js Server Actions before touching the database.

## Verification
Automated test suite `tests/cross-tenant-hardening.test.ts`:
- `"Anonymous client query on apps table is denied with 42501 under full anon lockdown"` (PASS)
- `"Anonymous client write on apps table is denied by RLS policy (error 42501)"` (PASS)
- `"Anonymous client write on dynamic per-app table is strictly denied by RLS"` (PASS)
- `"User B cannot saveAppConfig on User A's app"` (PASS)
