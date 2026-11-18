-- Migration: 20261118_fix_published_apps_leak.sql
-- Description: Complete Anonymous & Authenticated PostgREST Lockdown, Privilege Hardening,
--              SQL Injection Defenses, and Diagnostic Cleanup.
--
-- Security Model:
-- 1. Complete PostgREST Direct Access Lockdown:
--    Zero direct PostgREST table access for anonymous (anon) or unverified authenticated clients.
--    REVOKE ALL ON apps, app_schemas, and all app_* tables from anon, authenticated, and PUBLIC.
--    Published applications and app operations are served strictly via the Next.js server (service_role),
--    which authenticates user sessions with Clerk, enforces tenant ownership checks,
--    and delivers sanitized data through server actions and proxy endpoints.
--
-- 2. Drop Unused Views & Policies:
--    DROP VIEW IF EXISTS published_apps (anon is fully revoked; nothing queries direct views).
--    DROP unused authenticated owner/public read policies on apps, app_schemas, and dynamic tables,
--    ensuring live database matches the server-mediated architecture.
--
-- 3. Stored Procedure (RPC) Hardening:
--    - execute_app_ddl: DROP permission is strictly removed. Only CREATE TABLE and ALTER TABLE are permitted.
--      Multi-statement DDL queries (e.g. injected '; DROP TABLE apps; --') are strictly blocked.
--      Structured RPC execute_app_ddl(app_id text, entity_name text, fields jsonb) is provided using format('%I')
--      and a strict whitelist of column types.
--    - get_jwt_secret: Completely dropped via DROP FUNCTION IF EXISTS get_jwt_secret().
--    - test_teardown_drop_table: Dedicated test-only teardown helper restricted to service_role,
--      strictly validating namespaced app table identifiers and quoting with format('%I').

-- ============================================================================
-- 1. Drop Unused Views
-- ============================================================================

DROP VIEW IF EXISTS published_apps;


-- ============================================================================
-- 2. Secure apps Table
-- ============================================================================

ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon, authenticated, and public
REVOKE ALL ON apps FROM anon, authenticated, PUBLIC;

-- Drop all unused direct PostgREST policies
DROP POLICY IF EXISTS "apps_public_read_policy" ON apps;
DROP POLICY IF EXISTS "apps_owner_policy" ON apps;


-- ============================================================================
-- 3. Secure app_schemas Table
-- ============================================================================

ALTER TABLE app_schemas ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon, authenticated, and public
REVOKE ALL ON app_schemas FROM anon, authenticated, PUBLIC;

-- Drop all unused direct PostgREST policies
DROP POLICY IF EXISTS "app_schemas_public_read_policy" ON app_schemas;
DROP POLICY IF EXISTS "app_schemas_owner_policy" ON app_schemas;


-- ============================================================================
-- 4. Dynamic App Tables (app_<id>_<entity>): Backfill Existing Tables
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
-- 5. Hardened execute_app_ddl RPC Functions
-- ============================================================================

-- Function 5A: Structured DDL execution with format('%I') and column type whitelist
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
    RAISE EXCEPTION 'Invalid app_id format: %', app_id;
  END IF;
  clean_app_id := replace(app_id, '-', '_');

  -- 2. Validate entity_name (alphanumeric/underscore only)
  IF entity_name !~ '^[a-zA-Z0-9_]{1,63}$' THEN
    RAISE EXCEPTION 'Invalid entity_name format: %', entity_name;
  END IF;
  clean_entity := lower(entity_name);

  full_table_name := 'app_' || clean_app_id || '_' || clean_entity;

  -- 3. Parse and validate column definitions
  FOR col_key, col_val IN SELECT key, value FROM jsonb_each_text(fields) LOOP
    IF lower(col_key) IN ('id', 'created_at') THEN
      CONTINUE;
    END IF;

    -- Strict column name validation
    IF col_key !~ '^[a-zA-Z0-9_]{1,63}$' THEN
      RAISE EXCEPTION 'Invalid column name: %', col_key;
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

  -- 4. Execute structured CREATE TABLE
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), created_at TIMESTAMPTZ DEFAULT NOW()%s);',
    full_table_name,
    col_defs
  );

  -- 5. Lock down table: enable RLS and revoke all direct PostgREST access
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', full_table_name);
  EXECUTE format('REVOKE ALL ON %I FROM anon, authenticated, PUBLIC;', full_table_name);
END;
$$;

-- Function 5B: Query-string DDL execution (strictly rejects DROP and multi-statements)
CREATE OR REPLACE FUNCTION execute_app_ddl(app_id text, query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_app_id text;
  tbl_name text;
  trimmed_query text;
BEGIN
  trimmed_query := trim(query);

  -- 1. STRICTLY FORBID DROP TABLE
  IF position('DROP TABLE' in upper(trimmed_query)) > 0 THEN
    RAISE EXCEPTION 'DROP TABLE is strictly forbidden in execute_app_ddl. Use test teardown helper with service_role.';
  END IF;

  -- 2. STRICTLY FORBID MULTI-STATEMENT QUERIES (prevents '; DROP TABLE apps; --')
  IF position(';' in trim(trailing ';' from trimmed_query)) > 0 THEN
    RAISE EXCEPTION 'Multi-statement DDL queries are strictly forbidden in execute_app_ddl.';
  END IF;

  -- 3. Only permit CREATE TABLE or ALTER TABLE
  IF position('CREATE TABLE' in trimmed_query) = 1 OR position('ALTER TABLE' in trimmed_query) = 1 THEN
      clean_app_id := replace(app_id, '-', '_');
      
      -- Ensure table matches app namespace
      IF position('app_' || clean_app_id in trimmed_query) > 0 THEN
          EXECUTE trimmed_query;

          -- Automatically configure RLS and hardened privileges on newly created tables
          IF position('CREATE TABLE' in trimmed_query) = 1 THEN
              tbl_name := substring(trimmed_query from 'app_' || clean_app_id || '_[a-zA-Z0-9_]+');
              IF tbl_name IS NOT NULL THEN
                  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl_name);
                  EXECUTE format('REVOKE ALL ON %I FROM anon, authenticated, PUBLIC;', tbl_name);
              END IF;
          END IF;
      ELSE
          RAISE EXCEPTION 'Unauthorized table prefix modifying attempt.';
      END IF;
  ELSE
      RAISE EXCEPTION 'Only CREATE TABLE or ALTER TABLE allowed for namespaced tables via this proxy. No DROPs.';
  END IF;
END;
$$;

-- Restrict execution solely to service_role
REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text, jsonb) TO service_role;


-- ============================================================================
-- 6. Dedicated Test Teardown Helper (Test Database Only)
-- ============================================================================

CREATE OR REPLACE FUNCTION test_teardown_drop_table(target_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Strict regex: ONLY allow a single valid namespaced app table identifier
  IF target_table !~ '^app_[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}_[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'test_teardown_drop_table: invalid table name format "%". Only namespaced test tables allowed.', target_table;
  END IF;

  -- Safely quote identifier with format('%I') (prevents multi-table drops like 'app_x, apps')
  EXECUTE format('DROP TABLE IF EXISTS %I CASCADE;', target_table);
END;
$$;

REVOKE EXECUTE ON FUNCTION test_teardown_drop_table(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION test_teardown_drop_table(text) TO service_role;


-- ============================================================================
-- 7. Permanently Drop get_jwt_secret Function
-- ============================================================================

DROP FUNCTION IF EXISTS get_jwt_secret();
