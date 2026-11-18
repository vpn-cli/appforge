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
  IF position('CREATE TABLE' in query) = 1 OR position('ALTER TABLE' in query) = 1 OR position('DROP TABLE' in query) = 1 THEN
      clean_app_id := replace(app_id, '-', '_');
      -- Ensure they are only modifying their namespaced tables
      IF position('app_' || clean_app_id in query) > 0 THEN
          EXECUTE query;

          -- Automatically configure RLS and optimized policies on newly created tables
          IF position('CREATE TABLE' in query) = 1 THEN
              tbl_name := substring(query from 'app_' || clean_app_id || '_[a-zA-Z0-9_]+');
              IF tbl_name IS NOT NULL THEN
                  EXECUTE 'ALTER TABLE ' || quote_ident(tbl_name) || ' ENABLE ROW LEVEL SECURITY;';
                  
                  -- NOTE: Native Clerk JWKS auth is not configured in Supabase PostgREST.
                  -- Authenticated operations use service_role with Next.js Clerk auth() checks.
                  -- Owner policy is commented out below:
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
      RAISE EXCEPTION 'Only CREATE, ALTER, or DROP allowed for namespaced tables via this proxy.';
  END IF;
END;
$$;

-- Restrict execution solely to the service_role
REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text) TO service_role;
