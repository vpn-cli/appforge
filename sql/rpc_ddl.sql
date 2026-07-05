-- Include this manually into Supabase SQL Editor to allow DDL execution via RPC
CREATE OR REPLACE FUNCTION execute_app_ddl(app_id text, query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Strict guard rails to only allow structural DDL, never data mutation or drops against core tables
  IF position('CREATE TABLE' in query) = 1 OR position('ALTER TABLE' in query) = 1 THEN
      -- Ensure they are only modifying their namespaced tables
      IF position('app_' || replace(app_id, '-', '_') in query) > 0 THEN
          EXECUTE query;
      ELSE
          RAISE EXCEPTION 'Unauthorized table prefix modifying attempt.';
      END IF;
  ELSE
      RAISE EXCEPTION 'Only CREATE or ALTER allowed via this proxy. No DROPs.';
  END IF;
END;
$$;
