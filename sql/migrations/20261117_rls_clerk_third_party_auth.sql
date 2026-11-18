-- Migration: 20261117_rls_clerk_third_party_auth.sql
-- Security Model: Server-only DB access via service_role with Next.js Clerk auth() ownership checks.
-- Postgres RLS is active to block anonymous writes and restrict public reads solely to published apps.
-- NOTE: Native Clerk Third-Party Auth (JWKS token validation) is not configured in Supabase PostgREST.
-- Authenticated owner policies are commented out below; all authenticated operations are server-mediated.

-- 1. Performance Indexes for RLS InitPlan lookups
CREATE INDEX IF NOT EXISTS apps_user_id_idx ON apps(user_id);
CREATE INDEX IF NOT EXISTS app_schemas_app_id_idx ON app_schemas(app_id);

-- 2. Secure Core Tables: apps
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- NOTE: Commented out because all DB access uses service_role; direct PostgREST calls with Clerk JWTs
-- fail with PGRST301 without Supabase Dashboard JWKS configuration.
/*
DROP POLICY IF EXISTS "apps_owner_policy" ON apps;
CREATE POLICY "apps_owner_policy" ON apps
  FOR ALL TO authenticated
  USING (user_id = (select auth.jwt()->>'sub'))
  WITH CHECK (user_id = (select auth.jwt()->>'sub'));
*/

DROP POLICY IF EXISTS "apps_public_read_policy" ON apps;
CREATE POLICY "apps_public_read_policy" ON apps
  FOR SELECT TO anon, authenticated
  USING (published_config IS NOT NULL);

GRANT ALL ON apps TO authenticated;
GRANT SELECT ON apps TO anon;

-- 3. Secure Core Tables: app_schemas
ALTER TABLE app_schemas ENABLE ROW LEVEL SECURITY;

-- NOTE: Commented out because all DB access uses service_role with server-side Clerk auth() checks.
/*
DROP POLICY IF EXISTS "app_schemas_owner_policy" ON app_schemas;
CREATE POLICY "app_schemas_owner_policy" ON app_schemas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps
      WHERE apps.id = app_schemas.app_id
        AND apps.user_id = (select auth.jwt()->>'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apps
      WHERE apps.id = app_schemas.app_id
        AND apps.user_id = (select auth.jwt()->>'sub')
    )
  );
*/

DROP POLICY IF EXISTS "app_schemas_public_read_policy" ON app_schemas;
CREATE POLICY "app_schemas_public_read_policy" ON app_schemas
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps
      WHERE apps.id = app_schemas.app_id
        AND apps.published_config IS NOT NULL
    )
  );

GRANT ALL ON app_schemas TO authenticated;
GRANT SELECT ON app_schemas TO anon;

-- 4. Backfill RLS Policies on ALL Existing app_<id>_<entity> Dynamic Tables
DO $$
DECLARE
    app_rec RECORD;
    tbl RECORD;
    prefix TEXT;
BEGIN
    FOR app_rec IN SELECT id FROM apps LOOP
        prefix := 'app_' || replace(app_rec.id::text, '-', '_') || '_';
        FOR tbl IN
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public' AND tablename LIKE prefix || '%'
        LOOP
            -- Enable RLS
            EXECUTE 'ALTER TABLE public.' || quote_ident(tbl.tablename) || ' ENABLE ROW LEVEL SECURITY;';

            -- Clean up old policies if present
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('owner_policy_' || tbl.tablename) || ' ON public.' || quote_ident(tbl.tablename) || ';';
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('public_read_policy_' || tbl.tablename) || ' ON public.' || quote_ident(tbl.tablename) || ';';

            -- Owner full CRUD policy commented out (handled via service_role in Next.js Server Actions)
            /*
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (
                    EXISTS (SELECT 1 FROM apps WHERE id = %L::uuid AND user_id = (select auth.jwt()->>''sub''))
                ) WITH CHECK (
                    EXISTS (SELECT 1 FROM apps WHERE id = %L::uuid AND user_id = (select auth.jwt()->>''sub''))
                );',
                'owner_policy_' || tbl.tablename,
                tbl.tablename,
                app_rec.id,
                app_rec.id
            );
            */

            -- Create public read policy (if published)
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (
                    EXISTS (SELECT 1 FROM apps WHERE id = %L::uuid AND published_config IS NOT NULL)
                );',
                'public_read_policy_' || tbl.tablename,
                tbl.tablename,
                app_rec.id
            );

            -- Grant table privileges
            EXECUTE 'GRANT ALL ON public.' || quote_ident(tbl.tablename) || ' TO authenticated;';
            EXECUTE 'GRANT SELECT ON public.' || quote_ident(tbl.tablename) || ' TO anon;';
        END LOOP;
    END LOOP;
END $$;

-- 5. Update execute_app_ddl RPC to automatically apply optimized policies to newly provisioned tables
CREATE OR REPLACE FUNCTION execute_app_ddl(app_id text, query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_app_id text;
  tbl_name text;
BEGIN
  -- Strict guard rails to only allow structural DDL, never data mutation or drops against core tables
  IF position('CREATE TABLE' in query) = 1 OR position('ALTER TABLE' in query) = 1 THEN
      clean_app_id := replace(app_id, '-', '_');
      -- Ensure they are only modifying their namespaced tables
      IF position('app_' || clean_app_id in query) > 0 THEN
          EXECUTE query;

          -- Automatically configure RLS and optimized policies on newly created tables
          IF position('CREATE TABLE' in query) = 1 THEN
              tbl_name := substring(query from 'app_' || clean_app_id || '_[a-zA-Z0-9_]+');
              IF tbl_name IS NOT NULL THEN
                  EXECUTE 'ALTER TABLE ' || quote_ident(tbl_name) || ' ENABLE ROW LEVEL SECURITY;';
                  
                  -- Owner policy commented out: authenticated operations use service_role with Next.js Clerk checks
                  /*
                  EXECUTE format(
                    'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (
                       EXISTS (SELECT 1 FROM apps WHERE id = %L::uuid AND user_id = (select auth.jwt()->>''sub''))
                     ) WITH CHECK (
                       EXISTS (SELECT 1 FROM apps WHERE id = %L::uuid AND user_id = (select auth.jwt()->>''sub''))
                     );',
                    'owner_policy_' || tbl_name, tbl_name, app_id, app_id
                  );
                  */

                  EXECUTE format(
                    'CREATE POLICY %I ON %I FOR SELECT TO anon, authenticated USING (
                       EXISTS (SELECT 1 FROM apps WHERE id = %L::uuid AND published_config IS NOT NULL)
                     );',
                    'public_read_policy_' || tbl_name, tbl_name, app_id
                  );

                  EXECUTE 'GRANT ALL ON ' || quote_ident(tbl_name) || ' TO authenticated;';
                  EXECUTE 'GRANT SELECT ON ' || quote_ident(tbl_name) || ' TO anon;';
              END IF;
          END IF;
      ELSE
          RAISE EXCEPTION 'Unauthorized table prefix modifying attempt.';
      END IF;
  ELSE
      RAISE EXCEPTION 'Only CREATE or ALTER allowed via this proxy. No DROPs.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text) TO service_role;

