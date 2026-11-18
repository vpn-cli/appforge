-- Migration: 20261118_fix_published_apps_leak.sql
-- Description: Hardens data exposure on published apps and completely locks down schema metadata.
--
-- Vulnerabilities Addressed:
-- 1. apps Table Column Leak:
--    Previously, GRANT SELECT ON apps TO anon allowed public visitors to read the author's internal
--    Clerk user_id and private draft/WIP config on published apps.
--    Fix: Revoke table-wide SELECT from anon and grant column-level SELECT ONLY on safe public columns
--    (id, name, published_config, created_at, updated_at).
--
-- 2. app_schemas Metadata Leak:
--    Previously, app_schemas_public_read_policy allowed anon to read all entity schema definitions
--    for any published app.
--    Fix: Drop public read policy and revoke SELECT from anon. Schema metadata is internal to AppForge
--    and should only be accessible to the app owner / service_role.
--
-- 3. Dynamic App Tables (app_<id>_<entity>):
--    Maintain strict public read ONLY when the parent app is published (published_config IS NOT NULL).
--    Unpublished apps return 0 rows to anon. All writes require authenticated app owner.

-- ============================================================================
-- 1. Secure apps Table (Column-Level Privilege Lockdown)
-- ============================================================================

-- Ensure RLS is active
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Revoke blanket table SELECT from anon
REVOKE SELECT ON apps FROM anon;

-- Grant SELECT only on safe public columns (excluding user_id and draft config)
GRANT SELECT (id, name, published_config, created_at, updated_at) ON apps TO anon;

-- Keep authenticated full access
GRANT ALL ON apps TO authenticated;

-- Ensure public read policy restricts rows to published apps only
DROP POLICY IF EXISTS "apps_public_read_policy" ON apps;
CREATE POLICY "apps_public_read_policy" ON apps
  FOR SELECT TO anon, authenticated
  USING (published_config IS NOT NULL);


-- ============================================================================
-- 2. Lock Down app_schemas Table (Owner & Service-Role Only)
-- ============================================================================

-- Ensure RLS is active
ALTER TABLE app_schemas ENABLE ROW LEVEL SECURITY;

-- Drop public read policy (schema definitions are not public API)
DROP POLICY IF EXISTS "app_schemas_public_read_policy" ON app_schemas;

-- Revoke SELECT from anon
REVOKE SELECT ON app_schemas FROM anon;

-- Allow authenticated owner to access their app's schemas
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

GRANT ALL ON app_schemas TO authenticated;


-- ============================================================================
-- 3. Update execute_app_ddl RPC Function
-- Ensure newly provisioned dynamic tables continue to enforce published-only read
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_app_ddl(app_id text, query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_app_id text;
  tbl_name text;
BEGIN
  IF position('CREATE TABLE' in query) = 1 OR position('ALTER TABLE' in query) = 1 OR position('DROP TABLE' in query) = 1 THEN
      clean_app_id := replace(app_id, '-', '_');
      IF position('app_' || clean_app_id in query) > 0 THEN
          EXECUTE query;

          IF position('CREATE TABLE' in query) = 1 THEN
              tbl_name := substring(query from 'app_' || clean_app_id || '_[a-zA-Z0-9_]+');
              IF tbl_name IS NOT NULL THEN
                  EXECUTE 'ALTER TABLE ' || quote_ident(tbl_name) || ' ENABLE ROW LEVEL SECURITY;';
                  
                  -- Owner CRUD policy (via Clerk JWT sub claim)
                  EXECUTE format(
                    'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (
                       EXISTS (SELECT 1 FROM apps WHERE id = %L::uuid AND user_id = (select auth.jwt()->>''sub''))
                     ) WITH CHECK (
                       EXISTS (SELECT 1 FROM apps WHERE id = %L::uuid AND user_id = (select auth.jwt()->>''sub''))
                     );',
                    'owner_policy_' || tbl_name, tbl_name, app_id, app_id
                  );

                  -- Public read ONLY when parent app has published_config IS NOT NULL
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
      RAISE EXCEPTION 'Only CREATE, ALTER, or DROP allowed for namespaced tables via this proxy.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text) TO service_role;
