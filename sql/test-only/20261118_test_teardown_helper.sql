-- Migration: 20261118_test_teardown_helper.sql
-- ENVIRONMENT: Dedicated TEST Database ONLY (Never apply to production / live)
--
-- Purpose: Provides a secure, namespaced table teardown helper for automated integration test teardown.

CREATE OR REPLACE FUNCTION test_teardown_drop_table(target_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Strict regex: ONLY allow a single valid namespaced app table identifier
  -- app_<uuid>_<entity> where entity is up to 22 chars
  IF target_table !~ '^app_[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}_[a-zA-Z0-9_]{1,22}$' THEN
    RAISE EXCEPTION 'test_teardown_drop_table: invalid table name format "%". Only namespaced test tables allowed.', target_table;
  END IF;

  -- Safely quote identifier with format('%I') (prevents multi-table drops like "app_x, apps")
  EXECUTE format('DROP TABLE IF EXISTS %I CASCADE;', target_table);
END;
$$;

REVOKE EXECUTE ON FUNCTION test_teardown_drop_table(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION test_teardown_drop_table(text) TO service_role;
