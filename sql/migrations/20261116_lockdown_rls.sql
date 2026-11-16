-- Migration: 20261116_lockdown_rls.sql
-- 1. Enable RLS on all existing dynamic app_* tables with NO policies (service-role only)
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename LIKE 'app_%'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(tbl.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- 2. Lock down apps and app_schemas tables
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Nextjs Server Actions on apps" ON apps;

ALTER TABLE app_schemas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Nextjs Server Actions on app_schemas" ON app_schemas;

-- 3. Backfill app_schemas for any existing tables matching app_<app_id>_<entity>
DO $$
DECLARE
    tbl RECORD;
    app_record RECORD;
    prefix TEXT;
    entity_name TEXT;
BEGIN
    FOR app_record IN SELECT id, config, published_config FROM apps LOOP
        prefix := 'app_' || replace(app_record.id::text, '-', '_') || '_';
        FOR tbl IN
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public' AND tablename LIKE prefix || '%'
        LOOP
            entity_name := substring(tbl.tablename FROM length(prefix) + 1);
            IF entity_name IS NOT NULL AND entity_name <> '' THEN
                INSERT INTO app_schemas (app_id, table_name, schema_definition)
                VALUES (
                    app_record.id,
                    entity_name,
                    COALESCE(
                        app_record.published_config->'entities'->entity_name,
                        app_record.config->'entities'->entity_name,
                        '{}'::jsonb
                    )
                )
                ON CONFLICT (app_id, table_name) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 4. Update execute_app_ddl to automatically enable RLS on every newly created table
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

          -- Automatically enable RLS on newly created table with NO policies
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

-- 5. Revoke execution from public, anon, authenticated; grant solely to service_role
REVOKE EXECUTE ON FUNCTION execute_app_ddl(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_app_ddl(text, text) TO service_role;
