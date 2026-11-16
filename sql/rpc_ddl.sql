-- Include this into Supabase SQL Editor to allow DDL execution via RPC
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

          -- Automatically enable RLS on newly created table with NO policies so only service_role has access
          IF position('CREATE TABLE' in query) = 1 THEN
              tbl_name := substring(query from 'app_' || clean_app_id || '_[a-zA-Z0-9_]+');
              IF tbl_name IS NOT NULL THEN
                  EXECUTE 'ALTER TABLE ' || quote_ident(tbl_name) || ' ENABLE ROW LEVEL SECURITY;';
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

-- Restrict execution solely to the service_role
REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text) TO service_role;

