-- Migration: 20261118_fix_published_apps_leak.sql (Migration A - Expand Phase)
-- Description: Complete Anonymous & Authenticated PostgREST Lockdown, Default Privilege Hardening,
--              Structured DDL Engine with Column Addition & Type Change Rejection,
--              and Preservation of Legacy DDL for Zero-Downtime Deployment.
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
--    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
--    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
--    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
--    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
--    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
--    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
--    Ensures every newly created table, sequence, and function starts completely private,
--    regardless of how or by whom it was provisioned.
--
-- 3. Drop Unused Views & Policies:
--    DROP VIEW IF EXISTS published_apps (anon is fully revoked; nothing queries direct views).
--    DROP unused authenticated owner/public read policies on apps, app_schemas, and dynamic tables.
--
-- 4. Structured DDL Orchestration (execute_app_ddl):
--    - execute_app_ddl accepts structured parameters: (app_id text, entity_name text, fields jsonb).
--    - When table does NOT exist: executes CREATE TABLE with whitelisted column types and locks it down.
--    - When table DOES exist: runs ALTER TABLE ADD COLUMN IF NOT EXISTS for each field.
--    - If an existing column's type is changed, rejects with a clear exception.
--    - Strict length limits: entity_name <= 22 chars (63 Postgres max - 41 prefix chars = 22 max),
--      column names <= 63 chars. Rejects longer identifiers with clear error.
--    - Strict type whitelist: TEXT, NUMERIC, BOOLEAN, TIMESTAMPTZ. Rejects unknown types.
--    - Identifiers safely quoted using format('%I').
--    - search_path explicitly pinned to public, pg_temp.
--
-- 5. Expand / Contract Pattern:
--    - Migration A defines the new 3-argument execute_app_ddl while keeping the 2-argument
--      overload with strict safeguards (preventing DROP and multi-statement injection).
--    - Migration B will drop the 2-argument overload after the application code deploy is verified.
--
-- 6. Diagnostic Artifact Cleanup:
--    - Permanently drops get_jwt_secret().

-- ============================================================================
-- 1. Default Privileges Hardening (Tables, Sequences, Functions)
-- ============================================================================

-- Tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

-- Sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- Functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;


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
-- 6. Structured execute_app_ddl RPC Function (New 3-argument Overload)
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_app_ddl(app_id text, entity_name text, fields jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  clean_app_id text;
  clean_entity text;
  full_table_name text;
  col_key text;
  col_val text;
  col_type text;
  col_defs text := '';
  existing_type text;
  table_exists boolean;
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

  -- 3. Check if table already exists in public schema
  SELECT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = full_table_name
  ) INTO table_exists;

  -- 4. Process fields and apply DDL
  IF NOT table_exists THEN
    -- Table does not exist: validate columns and build column definitions for CREATE TABLE
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

      -- Strict type whitelist (reject unknown types instead of defaulting to TEXT)
      CASE lower(col_val)
        WHEN 'number' THEN col_type := 'NUMERIC';
        WHEN 'numeric' THEN col_type := 'NUMERIC';
        WHEN 'boolean' THEN col_type := 'BOOLEAN';
        WHEN 'date' THEN col_type := 'TIMESTAMPTZ';
        WHEN 'timestamptz' THEN col_type := 'TIMESTAMPTZ';
        WHEN 'text' THEN col_type := 'TEXT';
        WHEN 'string' THEN col_type := 'TEXT';
        ELSE
          RAISE EXCEPTION 'Invalid or unknown column type "%" for column "%". Allowed types are string, text, number, numeric, boolean, date, timestamptz.', col_val, col_key;
      END CASE;

      col_defs := col_defs || ', ' || format('%I %s', lower(col_key), col_type);
    END LOOP;

    -- Execute structured CREATE TABLE using format('%I', full_table_name)
    EXECUTE format(
      'CREATE TABLE %I (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), created_at TIMESTAMPTZ DEFAULT NOW()%s);',
      full_table_name,
      col_defs
    );

    -- Lock down table: enable RLS and revoke all direct PostgREST access
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', full_table_name);
    EXECUTE format('REVOKE ALL ON %I FROM anon, authenticated, PUBLIC;', full_table_name);
  ELSE
    -- Table already exists: validate columns, reject type changes, add new columns via ALTER TABLE ADD COLUMN
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

      -- Strict type whitelist (reject unknown types instead of defaulting to TEXT)
      CASE lower(col_val)
        WHEN 'number' THEN col_type := 'NUMERIC';
        WHEN 'numeric' THEN col_type := 'NUMERIC';
        WHEN 'boolean' THEN col_type := 'BOOLEAN';
        WHEN 'date' THEN col_type := 'TIMESTAMPTZ';
        WHEN 'timestamptz' THEN col_type := 'TIMESTAMPTZ';
        WHEN 'text' THEN col_type := 'TEXT';
        WHEN 'string' THEN col_type := 'TEXT';
        ELSE
          RAISE EXCEPTION 'Invalid or unknown column type "%" for column "%". Allowed types are string, text, number, numeric, boolean, date, timestamptz.', col_val, col_key;
      END CASE;

      -- Check if column exists in the existing table
      existing_type := NULL;
      SELECT t.typname INTO existing_type
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_type t ON a.atttypid = t.oid
      WHERE n.nspname = 'public'
        AND c.relname = full_table_name
        AND a.attname = lower(col_key)
        AND a.attnum > 0
        AND NOT a.attisdropped;

      IF existing_type IS NOT NULL THEN
        -- Column already exists: reject type change with a clear error
        IF (col_type = 'TEXT' AND existing_type NOT IN ('text', 'varchar'))
           OR (col_type = 'NUMERIC' AND existing_type NOT IN ('numeric', 'int2', 'int4', 'int8', 'float4', 'float8'))
           OR (col_type = 'BOOLEAN' AND existing_type != 'bool')
           OR (col_type = 'TIMESTAMPTZ' AND existing_type NOT IN ('timestamptz', 'timestamp')) THEN
          RAISE EXCEPTION 'Cannot change type of existing column "%" from "%" to "%".', col_key, existing_type, col_type;
        END IF;
      ELSE
        -- Column does not exist on existing table: add it
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I %s;', full_table_name, lower(col_key), col_type);
      END IF;
    END LOOP;

    -- Ensure RLS and privileges are locked down
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', full_table_name);
    EXECUTE format('REVOKE ALL ON %I FROM anon, authenticated, PUBLIC;', full_table_name);
  END IF;
END;
$$;

-- Restrict execution solely to service_role
REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text, jsonb) TO service_role;


-- ============================================================================
-- 7. Legacy 2-argument execute_app_ddl Overload (Expand Phase)
-- ============================================================================
-- Preserved during expand phase for backward compatibility with live application code.
-- Migration B (Contract Phase) will drop this function after the app deploy is verified.

CREATE OR REPLACE FUNCTION execute_app_ddl(app_id text, query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
                  EXECUTE 'ALTER TABLE ' || quote_ident(tbl_name) || ' ENABLE ROW LEVEL SECURITY;';
                  EXECUTE 'REVOKE ALL ON ' || quote_ident(tbl_name) || ' FROM anon, authenticated, PUBLIC;';
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


-- ============================================================================
-- 8. Permanently Drop get_jwt_secret Function
-- ============================================================================

DROP FUNCTION IF EXISTS get_jwt_secret();
