-- Include this into Supabase SQL Editor to allow DDL execution via RPC
-- Structured DDL execution with format('%I'), 22-char entity length limit, and column type whitelist

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

-- Restrict execution solely to the service_role
REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text, jsonb) TO service_role;
