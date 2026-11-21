import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// ============================================================================
// CLEANUP LIVE ARTIFACTS SCRIPT
// ============================================================================
// Defaults to DRY-RUN mode.
// Requires explicit CLI flags to execute against live:
//   node scripts/cleanup-live-artifacts.mjs --execute --confirm-drop-live-artifacts
// ============================================================================

// Target artifact objects to drop from live Supabase project (upljqampxcmhqjszatrp)
export const DIAGNOSTIC_TABLES = [
  "app_df557309_95e1_4b71_be92_759bf3ff33fc_policies_check_del",
  "app_df557309_95e1_4b71_be92_759bf3ff33fc_pgtables_check_del",
  "app_test_jwt_probe",
  "app_test_123_items",
  "app_test_items",
];

export const CI_LEFTOVER_TABLES = [
  "app_f5be6406_cb53_4af4_aee2_05fa0ccba0a9_notes",
  "app_eb70fc00_0196_464f_9320_dd6fe6295b73_items",
  "app_2a9210d8_86be_421f_ba3a_c095bab1626a_items",
  "app_eb84e6f7_1799_4a55_b29b_9137598e85c5_items",
  "app_8d3ecb13_4f23_41dc_aac0_1d6f3449088e_items",
  "app_6f6fdb9e_c721_40a2_a788_6d74144f71db_notes",
  "app_0f13d32d_e931_4a74_b88a_d176cfdcd159_notes",
  "app_a01d957d_ed2e_4596_8e47_08072c9b8ea9_notes",
  "app_a665af9f_675c_4c18_af7d_fcf2b6f514fc_items",
  "app_0c8e8360_c132_4dba_a6d1_976293a5f129_items",
  "app_6bdcc1f0_e97f_46a8_ab57_4f7e26ac3ced_notes",
  "app_76bdbe5b_bb58_449a_8011_3dfe1f3b6192_notes",
];

export const TARGET_FUNCTIONS = [
  "get_jwt_secret()",
];

export const TARGET_VIEWS = [
  "published_apps",
];

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      env[key] = val;
    }
  }
  return env;
}

async function main() {
  const isExecute = process.argv.includes("--execute");
  const isConfirmed = process.argv.includes("--confirm-drop-live-artifacts");
  const env = loadEnv();

  const supabaseUrl = env.NEXT_PUBLIC_INSFORGE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("=================================================================");
  console.log("🛡️  SUPABASE LIVE DATABASE CLEANUP UTILITY");
  console.log("=================================================================");
  console.log(`Target URL : ${supabaseUrl || "MISSING"}`);
  console.log(`Mode       : ${isExecute && isConfirmed ? "⚠️  LIVE EXECUTION" : "🔍  DRY-RUN (Safe Default)"}`);
  console.log("=================================================================\n");

  const allTablesToDrop = [...DIAGNOSTIC_TABLES, ...CI_LEFTOVER_TABLES];

  console.log("📋 Target Objects for Cleanup:");
  console.log(`\n1. Diagnostic Tables (${DIAGNOSTIC_TABLES.length}):`);
  DIAGNOSTIC_TABLES.forEach((t) => console.log(`   - ${t}`));

  console.log(`\n2. CI / Test Leftover Tables (${CI_LEFTOVER_TABLES.length}):`);
  CI_LEFTOVER_TABLES.forEach((t) => console.log(`   - ${t}`));

  console.log(`\n3. Functions (${TARGET_FUNCTIONS.length}):`);
  TARGET_FUNCTIONS.forEach((f) => console.log(`   - ${f}`));

  console.log(`\n4. Views (${TARGET_VIEWS.length}):`);
  TARGET_VIEWS.forEach((v) => console.log(`   - ${v}`));

  // Generate exact SQL script for user manual execution in Supabase SQL editor
  console.log("\n=================================================================");
  console.log("📝 SQL STATEMENTS TO RUN IN SUPABASE SQL EDITOR:");
  console.log("=================================================================");
  const sqlLines = [
    "-- Drop views",
    ...TARGET_VIEWS.map((v) => `DROP VIEW IF EXISTS ${v};`),
    "",
    "-- Drop functions",
    ...TARGET_FUNCTIONS.map((f) => `DROP FUNCTION IF EXISTS ${f};`),
    "",
    "-- Drop diagnostic tables",
    ...DIAGNOSTIC_TABLES.map((t) => `DROP TABLE IF EXISTS ${t} CASCADE;`),
    "",
    "-- Drop CI/test leftover tables",
    ...CI_LEFTOVER_TABLES.map((t) => `DROP TABLE IF EXISTS ${t} CASCADE;`),
  ];
  console.log(sqlLines.join("\n"));
  console.log("=================================================================\n");

  if (!isExecute || !isConfirmed) {
    console.log("ℹ️  DRY-RUN COMPLETE: 0 changes were made to the live database.");
    console.log("   To execute drops programmatically, run with both flags:");
    console.log("   node scripts/cleanup-live-artifacts.mjs --execute --confirm-drop-live-artifacts\n");
    console.log("   Or copy the SQL block above directly into the Supabase Dashboard SQL Editor.");
    return;
  }

  // Live guard check
  if (!serviceKey || !supabaseUrl) {
    console.error("❌ Cannot execute: missing NEXT_PUBLIC_INSFORGE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  console.log("⚠️  EXECUTING CLEANUP ON LIVE DATABASE...");
  const supabase = createClient(supabaseUrl, serviceKey);

  for (const table of allTablesToDrop) {
    // Attempt dropping via namespaced DDL helper
    const appId = table.replace(/^app_/, "").split("_").slice(0, 5).join("-");
    const { error } = await supabase.rpc("execute_app_ddl", {
      app_id: appId,
      query: `DROP TABLE IF EXISTS ${table};`,
    });

    if (error) {
      console.log(`   ⚠️ Could not drop ${table} via execute_app_ddl: ${error.message}`);
    } else {
      console.log(`   ✅ Dropped ${table}`);
    }
  }

  console.log("\nCleanup execution completed. Please verify remaining tables via Supabase dashboard.");
}

main().catch((err) => {
  console.error("Fatal error running cleanup script:", err);
  process.exit(1);
});
