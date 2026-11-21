-- Migration: 20261118_contract_legacy_ddl.sql (Migration B - Contract Phase)
-- Description: Drops the legacy 2-argument execute_app_ddl(text, text) overload after
--              the new application code deployment is verified in production.
--
-- Prerequisites:
-- 1. Migration A (20261118_fix_published_apps_leak.sql) must be applied.
-- 2. Application code with structured execute_app_ddl(app_id, entity_name, fields) must be merged and deployed.
-- 3. Verify saving and updating a schema in production.

DROP FUNCTION IF EXISTS execute_app_ddl(text, text);
