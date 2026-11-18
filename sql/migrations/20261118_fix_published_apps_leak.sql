-- Migration: 20261118_fix_published_apps_leak.sql
-- Description: Complete Anonymous & Authenticated PostgREST Lockdown, Default Privilege Hardening,
--              Structured DDL Engine, and Artifact Cleanup.
--
-- Security Model:
-- 1. Complete PostgREST Direct Access Lockdown:
--    Zero direct PostgREST table access for anonymous (anon) or unverified authenticated clients.
--    REVOKE ALL ON apps, app_schemas, and all app_* tables from anon, authenticated, and PUBLIC.
--    Published applications and app operations are served strictly via the Next.js server (service_role),
--    which authenticates user sessions with Clerk, enforces tenant ownership checks,
--    and delivers sanitized data through server actions and proxy endpoints.
--
-- 2. Default Privilege Revocation:
--    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated.
--    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated.
--    Ensures that every newly created table starts completely private (0 privileges to anon/authenticated),
--    regardless of how or by whom it was provisioned.
--
-- 3. Drop Unused Views & Policies:
--    DROP VIEW IF EXISTS published_apps (anon is fully revoked; nothing queries direct views).
--    DROP unused authenticated owner/public read policies on apps, app_schemas, and dynamic tables,
--    ensuring live database matches the server-mediated architecture.
--
-- 4. Structured DDL Orchestration (execute_app_ddl):
--    - execute_app_ddl accepts ONLY structured parameters: (app_id text, entity_name text, fields jsonb).
--    - Raw `query text` parameter is COMPLETELY REMOVED.
--    - No string blacklists: eliminates all string concatenation and multi-statement injection vectors.
--    - Strict length limits: entity_name <= 22 chars (63 Postgres max - 41 prefix chars = 22 max),
--      column names <= 63 chars. Rejects longer identifiers with clear error.
--    - Strict type whitelist: TEXT, NUMERIC, BOOLEAN, TIMESTAMPTZ.
--    - Identifiers safely quoted using format('%I').
--    - No public_read or owner policies created on new tables (server-mediated auth).
--
-- 5. Diagnostic Artifact Cleanup:
--    - Permanently drops get_jwt_secret().

-- ============================================================================
-- 1. Default Privileges Hardening (Future Tables Start Completely Private)
-- ============================================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;


-- ============================================================================
-- 2. Drop Unused Views
-- ============================================================================

DROP VIEW IF EXISTS published_apps;


-- ============================================================================
-- 3. Secure apps Table
-- ============================================================================

ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon, authenticated, and public
REVOKE ALL ON apps FROM anon, authenticated, PUBLIC;

-- Drop all unused direct PostgREST policies
DROP POLICY IF EXISTS "apps_public_read_policy" ON apps;
DROP POLICY IF EXISTS "apps_owner_policy" ON apps;


-- ============================================================================
-- 4. Secure app_schemas Table
-- ============================================================================

ALTER TABLE app_schemas ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon, authenticated, and public
REVOKE ALL ON app_schemas FROM anon, authenticated, PUBLIC;

-- Drop all unused direct PostgREST policies
DROP POLICY IF EXISTS "app_schemas_public_read_policy" ON app_schemas;
DROP POLICY IF EXISTS "app_schemas_owner_policy" ON app_schemas;


-- ============================================================================
-- 5. Dynamic App Tables (app_<id>_<entity>): Backfill Existing Tables
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

        -- Revoke all direct PostgREST access from anon, authenticated, and public
        EXECUTE 'REVOKE ALL ON ' || quote_ident(r.tablename) || ' FROM anon, authenticated, PUBLIC;';

        -- Drop all unused legacy public_read and owner policies
        FOR pol IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
              AND tablename = r.tablename 
              AND (
                policyname LIKE 'public_read_policy_%' 
                OR policyname LIKE 'owner_policy_%'
              )
        ) LOOP
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(r.tablename) || ';';
        END LOOP;
    END LOOP;
END $$;


-- ============================================================================
-- 6. Structured execute_app_ddl RPC Function (No Raw Query Text, No Blacklists)
-- ============================================================================

-- Drop legacy raw-query overload completely
DROP FUNCTION IF EXISTS execute_app_ddl(text, text);

CREATE OR REPLACE FUNCTION execute_app_ddl(app_id text, entity_name text, fields jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_app_id text;
  clean_entity text;
  full_table_name text;
  col_key text;
  col_val text;
  col_type text;
  col_defs text := '';
BEGIN
  -- 1. Validate app_id format (must be UUID)
  IF app_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid app_id format: "%"', app_id;
  END IF;
  clean_app_id := replace(app_id, '-', '_');

  -- 2. Validate entity_name length (max 22 chars: Postgres limit 63 - 41 prefix chars = 22 max)
  IF length(entity_name) > 22 THEN
    RAISE EXCEPTION 'Entity name "%" exceeds maximum length of 22 characters.', entity_name;
  END IF;

  -- Validate entity_name format (alphanumeric/underscore only)
  IF entity_name !~ '^[a-zA-Z0-9_]{1,22}$' THEN
    RAISE EXCEPTION 'Invalid entity_name format: "%". Must be alphanumeric/underscore only.', entity_name;
  END IF;
  clean_entity := lower(entity_name);

  full_table_name := 'app_' || clean_app_id || '_' || clean_entity;

  -- 3. Parse and validate column definitions
  FOR col_key, col_val IN SELECT key, value FROM jsonb_each_text(fields) LOOP
    IF lower(col_key) IN ('id', 'created_at') THEN
      CONTINUE;
    END IF;

    -- Validate column identifier length (max 63 chars)
    IF length(col_key) > 63 THEN
      RAISE EXCEPTION 'Column name "%" exceeds maximum length of 63 characters.', col_key;
    END IF;

    -- Validate column identifier format
    IF col_key !~ '^[a-zA-Z0-9_]{1,63}$' THEN
      RAISE EXCEPTION 'Invalid column name format: "%". Must be alphanumeric/underscore only.', col_key;
    END IF;

    -- Strict type whitelist
    CASE lower(col_val)
      WHEN 'number' THEN col_type := 'NUMERIC';
      WHEN 'numeric' THEN col_type := 'NUMERIC';
      WHEN 'boolean' THEN col_type := 'BOOLEAN';
      WHEN 'date' THEN col_type := 'TIMESTAMPTZ';
      WHEN 'timestamptz' THEN col_type := 'TIMESTAMPTZ';
      WHEN 'text' THEN col_type := 'TEXT';
      WHEN 'string' THEN col_type := 'TEXT';
      ELSE col_type := 'TEXT';
    END CASE;

    col_defs := col_defs || ', ' || format('%I %s', lower(col_key), col_type);
  END LOOP;

  -- 4. Execute structured CREATE TABLE using format('%I', full_table_name)
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), created_at TIMESTAMPTZ DEFAULT NOW()%s);',
    full_table_name,
    col_defs
  );

  -- 5. Lock down table: enable RLS and revoke all direct PostgREST access
  -- Note: Consistent with dropping policies on existing tables, NO public_read or owner policies
  -- are created on newly provisioned tables. All access is server-mediated via service_role.
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', full_table_name);
  EXECUTE format('REVOKE ALL ON %I FROM anon, authenticated, PUBLIC;', full_table_name);
END;
$$;

-- Restrict execution solely to service_role
REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text, jsonb) TO service_role;


-- ============================================================================
-- 7. Permanently Drop get_jwt_secret Function
-- ============================================================================

DROP FUNCTION IF EXISTS get_jwt_secret();
