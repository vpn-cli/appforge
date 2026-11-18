-- Migration: 20261118_fix_published_apps_leak.sql
-- Description: Complete Anonymous Lockdown and Privilege Hardening
--
-- Security Model:
-- 1. Complete Anonymous Lockdown:
--    Zero direct PostgREST table access for anonymous clients (anon role).
--    REVOKE ALL ON apps, app_schemas, and all app_* tables from anon and PUBLIC.
--    Published applications are served strictly via the Next.js server (service_role),
--    which safely strips internal metadata (author user_id, unpublished draft config)
--    and delivers only public sanitized configurations and authorized proxy operations.
--
-- 2. Dangerous Privilege Revocation:
--    REVOKE TRUNCATE, TRIGGER, REFERENCES from anon and authenticated on apps,
--    app_schemas, and all dynamic app_* tables. Only safe DML (SELECT, INSERT, UPDATE, DELETE)
--    is granted to authenticated (and strictly governed by Postgres RLS).
--
-- 3. Stored Procedure (RPC) Lockdown:
--    REVOKE EXECUTE from PUBLIC, anon, and authenticated on execute_app_ddl and get_jwt_secret.
--    Execute privileges are restricted exclusively to service_role.

-- ============================================================================
-- 1. Secure apps Table
-- ============================================================================

ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon and public
REVOKE ALL ON apps FROM anon, PUBLIC;

-- Revoke dangerous administrative privileges from authenticated
REVOKE TRUNCATE, TRIGGER, REFERENCES ON apps FROM authenticated, anon, PUBLIC;

-- Grant safe DML solely to authenticated (governed by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON apps TO authenticated;

-- Drop public read policy (anon no longer queries apps directly; server handles published reads)
DROP POLICY IF EXISTS "apps_public_read_policy" ON apps;

-- Ensure owner policy restricts authenticated users to their own apps
DROP POLICY IF EXISTS "apps_owner_policy" ON apps;
CREATE POLICY "apps_owner_policy" ON apps
  FOR ALL TO authenticated
  USING (user_id = (SELECT (auth.jwt() ->> 'sub'::text)))
  WITH CHECK (user_id = (SELECT (auth.jwt() ->> 'sub'::text)));


-- ============================================================================
-- 2. Secure app_schemas Table
-- ============================================================================

ALTER TABLE app_schemas ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon and public
REVOKE ALL ON app_schemas FROM anon, PUBLIC;

-- Revoke dangerous administrative privileges from authenticated
REVOKE TRUNCATE, TRIGGER, REFERENCES ON app_schemas FROM authenticated, anon, PUBLIC;

-- Grant safe DML solely to authenticated (governed by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON app_schemas TO authenticated;

-- Drop public read policy (schema definitions are internal metadata, never exposed to anon)
DROP POLICY IF EXISTS "app_schemas_public_read_policy" ON app_schemas;

-- Ensure owner policy restricts schema access to the app's owner
DROP POLICY IF EXISTS "app_schemas_owner_policy" ON app_schemas;
CREATE POLICY "app_schemas_owner_policy" ON app_schemas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps
      WHERE apps.id = app_schemas.app_id
        AND apps.user_id = (SELECT (auth.jwt() ->> 'sub'::text))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apps
      WHERE apps.id = app_schemas.app_id
        AND apps.user_id = (SELECT (auth.jwt() ->> 'sub'::text))
    )
  );


-- ============================================================================
-- 3. Dynamic App Tables (app_<id>_<entity>): Backfill Existing Tables
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    pol RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename LIKE 'app\_%'
    ) LOOP
        -- Enable RLS
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';

        -- Revoke all access from anon and public
        EXECUTE 'REVOKE ALL ON ' || quote_ident(r.tablename) || ' FROM anon, PUBLIC;';

        -- Revoke dangerous privileges from authenticated
        EXECUTE 'REVOKE TRUNCATE, TRIGGER, REFERENCES ON ' || quote_ident(r.tablename) || ' FROM authenticated, anon, PUBLIC;';

        -- Grant only safe DML to authenticated
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ' || quote_ident(r.tablename) || ' TO authenticated;';

        -- Drop public read policies on dynamic tables (anon does not query tables directly)
        FOR pol IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
              AND tablename = r.tablename 
              AND policyname LIKE 'public_read_policy_%'
        ) LOOP
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(r.tablename) || ';';
        END LOOP;
    END LOOP;
END $$;


-- ============================================================================
-- 4. Update execute_app_ddl RPC Function
-- Ensure newly provisioned dynamic tables are automatically created with
-- complete anon lockdown and restricted authenticated privileges.
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
  -- Strict guard rails to only allow structural DDL, never data mutation or drops against core tables
  IF position('CREATE TABLE' in query) = 1 OR position('ALTER TABLE' in query) = 1 OR position('DROP TABLE' in query) = 1 THEN
      clean_app_id := replace(app_id, '-', '_');
      -- Ensure they are only modifying their namespaced tables
      IF position('app_' || clean_app_id in query) > 0 THEN
          EXECUTE query;

          -- Automatically configure RLS and hardened privileges on newly created tables
          IF position('CREATE TABLE' in query) = 1 THEN
              tbl_name := substring(query from 'app_' || clean_app_id || '_[a-zA-Z0-9_]+');
              IF tbl_name IS NOT NULL THEN
                  EXECUTE 'ALTER TABLE ' || quote_ident(tbl_name) || ' ENABLE ROW LEVEL SECURITY;';
                  
                  -- Revoke all permissions from anon and public
                  EXECUTE 'REVOKE ALL ON ' || quote_ident(tbl_name) || ' FROM anon, PUBLIC;';

                  -- Revoke dangerous privileges from authenticated
                  EXECUTE 'REVOKE TRUNCATE, TRIGGER, REFERENCES ON ' || quote_ident(tbl_name) || ' FROM authenticated, anon, PUBLIC;';

                  -- Grant safe DML to authenticated
                  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ' || quote_ident(tbl_name) || ' TO authenticated;';

                  -- Owner CRUD policy (via Clerk JWT sub claim)
                  EXECUTE format(
                    'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (
                       EXISTS (SELECT 1 FROM apps WHERE id = %L::uuid AND user_id = (SELECT (auth.jwt() ->> ''sub''::text)))
                     ) WITH CHECK (
                       EXISTS (SELECT 1 FROM apps WHERE id = %L::uuid AND user_id = (SELECT (auth.jwt() ->> ''sub''::text)))
                     );',
                    'owner_policy_' || tbl_name, tbl_name, app_id, app_id
                  );
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


-- ============================================================================
-- 5. Stored Procedure (RPC) Privilege Revocations
-- ============================================================================

-- Strictly restrict execute_app_ddl to service_role
REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text) TO service_role;

-- Strictly restrict get_jwt_secret (if present) to service_role
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' AND p.proname = 'get_jwt_secret'
    ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION get_jwt_secret() FROM PUBLIC, anon, authenticated;';
        EXECUTE 'GRANT EXECUTE ON FUNCTION get_jwt_secret() TO service_role;';
    END IF;
END $$;
