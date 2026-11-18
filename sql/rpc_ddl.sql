-- Include this into Supabase SQL Editor to allow DDL execution via RPC
-- Function 1: Structured DDL execution with format('%I') and column type whitelist
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

-- Function 2: Query-string DDL execution (strictly rejects DROP and multi-statements)
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

-- Restrict execution solely to the service_role
REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text, jsonb) TO service_role;

-- Dedicated Test Teardown Helper
CREATE OR REPLACE FUNCTION test_teardown_drop_table(target_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF target_table !~ '^app_[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}_[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'test_teardown_drop_table: invalid table name format "%". Only namespaced test tables allowed.', target_table;
  END IF;
  EXECUTE format('DROP TABLE IF EXISTS %I CASCADE;', target_table);
END;
$$;

REVOKE EXECUTE ON FUNCTION test_teardown_drop_table(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION test_teardown_drop_table(text) TO service_role;
