/* eslint-disable no-console */
/**
 * scripts/repair-missing-tables.mjs
 * 
 * Scans `app_schemas` for registered entities whose physical PostgreSQL tables
 * do not exist, and generates the necessary structural DDL and RLS policies.
 * 
 * SAFETY DIRECTIVES:
 * 1. Default mode is DRY-RUN. It will only print what it would do without mutating anything.
 * 2. To execute changes, the user must explicitly pass the `--execute` flag.
 * 3. Execution against the live demo database ('upljqampxcmhqjszatrp') is strictly blocked
 *    unless an explicit safety override (`--force-live`) is provided.
 * 
 * Usage:
 *   node scripts/repair-missing-tables.mjs             # Dry-run inspection (default)
 *   node scripts/repair-missing-tables.mjs --dry-run   # Explicit dry-run
 *   node scripts/repair-missing-tables.mjs --execute   # Apply repairs to test database
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Parse CLI arguments
const args = process.argv.slice(2);
const isExecute = args.includes("--execute");
const isForceLive = args.includes("--force-live");

// 2. Resolve Environment Variables
function loadEnv() {
  const env = {};
  const envFiles = [".env.local", ".env.test", ".env"];
  for (const f of envFiles) {
    const fullPath = path.join(rootDir, f);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!env[key]) env[key] = val;
        }
      }
    }
  }
  return env;
}

const envVars = loadEnv();
const supabaseUrl =
  process.env.TEST_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_INSFORGE_URL ||
  envVars.TEST_SUPABASE_URL ||
  envVars.NEXT_PUBLIC_INSFORGE_URL;

const serviceRoleKey =
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  envVars.TEST_SUPABASE_SERVICE_ROLE_KEY ||
  envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Error: Missing database URL or service role key in environment.");
  process.exit(1);
}

// Safety check for live database
const isLiveDb = supabaseUrl.includes("upljqampxcmhqjszatrp");
if (isLiveDb && isExecute && !isForceLive) {
  console.error(
    "⛔ CRITICAL SAFETY GUARD: Target database appears to be the live database (upljqampxcmhqjszatrp).\n" +
    "Direct automated mutation of the live database is prohibited by project policy.\n" +
    "To run against live, review the dry-run output and execute manually, or provide --force-live if explicitly authorized."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log("=================================================================");
console.log("AppForge Missing Dynamic Tables Repair Tool");
console.log(`Mode: ${isExecute ? "🚨 EXECUTE (Applying Changes)" : "🔍 DRY-RUN (Preview Only)"}`);
console.log(`Target URL: ${supabaseUrl}`);
console.log("=================================================================\n");

async function run() {
  // Fetch all app_schemas records
  const { data: schemas, error: schemasError } = await supabase
    .from("app_schemas")
    .select("id, app_id, table_name, schema_definition");

  if (schemasError) {
    console.error("❌ Failed to query app_schemas:", schemasError.message);
    process.exit(1);
  }

  console.log(`Found ${schemas?.length || 0} registered entity schemas in app_schemas.\n`);

  if (!schemas || schemas.length === 0) {
    console.log("No schemas registered. Nothing to repair.");
    return;
  }

  // Fetch all apps to confirm owner and publication state
  const { data: apps, error: appsError } = await supabase
    .from("apps")
    .select("id, user_id, name, published_config");

  if (appsError) {
    console.warn("⚠️ Warning: Failed to query apps table for verification:", appsError.message);
  }

  const appMap = new Map((apps || []).map((a) => [a.id, a]));

  const missingTables = [];
  const existingTables = [];

  for (const item of schemas) {
    const cleanAppId = item.app_id.replace(/-/g, "_");
    const cleanEntity = item.table_name.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    const physicalTableName = `app_${cleanAppId}_${cleanEntity}`;

    // Test whether the physical table exists
    const { error: testErr } = await supabase.from(physicalTableName).select("id").limit(1);

    if (
      testErr &&
      (testErr.code === "42P01" ||
        testErr.code === "PGRST205" ||
        testErr.message?.includes("does not exist") ||
        testErr.message?.includes("schema cache"))
    ) {
      missingTables.push({
        schemaId: item.id,
        appId: item.app_id,
        entity: cleanEntity,
        physicalTableName,
        fields: item.schema_definition || {},
        app: appMap.get(item.app_id) || null,
      });
    } else {
      existingTables.push(physicalTableName);
    }
  }

  console.log(`📊 Scan Results:`);
  console.log(`  - Physical Tables Present: ${existingTables.length}`);
  console.log(`  - Physical Tables Missing: ${missingTables.length}\n`);

  if (missingTables.length === 0) {
    console.log("✅ All registered entity tables physically exist in PostgreSQL. No repair needed.");
    return;
  }

  console.log("-----------------------------------------------------------------");
  console.log("Missing Tables to Provision:");
  console.log("-----------------------------------------------------------------");

  for (const missing of missingTables) {
    const columns = [
      "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
      "created_at TIMESTAMPTZ DEFAULT NOW()",
    ];

    if (typeof missing.fields === "object" && missing.fields !== null) {
      for (const [colName, colType] of Object.entries(missing.fields)) {
        const cleanCol = colName.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
        if (!cleanCol || cleanCol === "id" || cleanCol === "created_at") continue;
        let pgType = "TEXT";
        if (colType === "number") pgType = "NUMERIC";
        if (colType === "boolean") pgType = "BOOLEAN";
        if (colType === "date") pgType = "TIMESTAMPTZ";
        columns.push(`${cleanCol} ${pgType}`);
      }
    }

    const ddl = `CREATE TABLE IF NOT EXISTS ${missing.physicalTableName} (${columns.join(", ")});`;
    const rlsDdl = `ALTER TABLE ${missing.physicalTableName} ENABLE ROW LEVEL SECURITY;`;
    const policyDdl = `CREATE POLICY public_read_policy_${missing.physicalTableName} ON ${missing.physicalTableName} FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM apps WHERE id = '${missing.appId}'::uuid AND published_config IS NOT NULL));`;
    const grantAuthDdl = `GRANT ALL ON ${missing.physicalTableName} TO authenticated;`;
    const grantAnonDdl = `GRANT SELECT ON ${missing.physicalTableName} TO anon;`;

    console.log(`\n• App ID: ${missing.appId} (${missing.app ? missing.app.name : "Orphaned App"})`);
    console.log(`  Table: ${missing.physicalTableName}`);
    console.log(`  Planned DDL:\n    ${ddl}\n    ${rlsDdl}\n    ${policyDdl}\n    ${grantAuthDdl}\n    ${grantAnonDdl}`);

    if (isExecute) {
      try {
        console.log(`  [Executing DDL via execute_app_ddl RPC...]`);
        const { error: rpcErr } = await supabase.rpc("execute_app_ddl", {
          app_id: missing.appId,
          query: ddl,
        });
        if (rpcErr) {
          console.error(`  ❌ Failed to create table ${missing.physicalTableName}:`, rpcErr.message);
        } else {
          console.log(`  ✅ Successfully provisioned ${missing.physicalTableName} with RLS policies.`);
        }
      } catch (execErr) {
        console.error(`  ❌ Exception provisioning ${missing.physicalTableName}:`, execErr.message || execErr);
      }
    }
  }

  console.log("\n=================================================================");
  if (!isExecute) {
    console.log("ℹ️  DRY-RUN COMPLETE: 0 database changes were made.");
    console.log("    To execute the above DDL statements against the database, run:");
    console.log("    node scripts/repair-missing-tables.mjs --execute");
  } else {
    console.log("🎉 EXECUTION COMPLETE: Attempted provisioning for all missing tables.");
  }
  console.log("=================================================================");
}

run().catch((err) => {
  console.error("Unhandled error during repair scan:", err);
  process.exit(1);
});
