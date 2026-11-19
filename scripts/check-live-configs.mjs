#!/usr/bin/env node
import fs from "fs";
import path from "path";
import readline from "readline";
import pg from "pg";
import { AppConfigSchema, validateComponentNode } from "../lib/validation.ts";

const { Client } = pg;

// Parse CLI flags
const isLive = process.argv.includes("--live");

// Strictly reject connection strings passed via command-line flags or arguments
for (const arg of process.argv.slice(2)) {
  if (
    arg.startsWith("--db") ||
    arg.startsWith("--database") ||
    arg.includes("postgres://") ||
    arg.includes("postgresql://")
  ) {
    console.error("\n❌ Security Violation: Database connection strings must NEVER be passed as command-line arguments.");
    console.error("Store the connection string in a gitignored env file (.env.local or .env.test) or enter it at the interactive prompt.\n");
    process.exit(1);
  }
}

// Load environment variables from gitignored env files
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const envTest = loadEnvFile(path.resolve(process.cwd(), ".env.test"));
const envLocal = loadEnvFile(path.resolve(process.cwd(), ".env.local"));

async function promptForDatabaseUrl(promptText) {
  if (!process.stdin.isTTY) {
    return null;
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function resolveConnectionString(liveMode) {
  if (liveMode) {
    const fromEnv =
      envLocal.LIVE_DATABASE_URL ||
      envLocal.DATABASE_URL ||
      envLocal.POSTGRES_URL ||
      process.env.LIVE_DATABASE_URL ||
      process.env.DATABASE_URL;

    if (fromEnv) return fromEnv;

    console.log("LIVE database connection string not found in gitignored .env.local.");
    const prompted = await promptForDatabaseUrl("Enter LIVE PostgreSQL connection string: ");
    if (prompted) return prompted;

    console.error("\n❌ Error: LIVE database connection string not found.");
    console.error("Please add LIVE_DATABASE_URL or DATABASE_URL to your gitignored .env.local file or run interactively to be prompted.\n");
    process.exit(1);
  } else {
    const fromEnv =
      envTest.TEST_DATABASE_URL ||
      envTest.DATABASE_URL ||
      process.env.TEST_DATABASE_URL ||
      process.env.DATABASE_URL;

    if (fromEnv) return fromEnv;

    console.log("TEST database connection string not found in gitignored .env.test.");
    const prompted = await promptForDatabaseUrl("Enter TEST PostgreSQL connection string: ");
    if (prompted) return prompted;

    console.error("\n❌ Error: TEST database connection string not found.");
    console.error("Please add TEST_DATABASE_URL to your gitignored .env.test file or run interactively to be prompted.\n");
    process.exit(1);
  }
}

async function runAudit() {
  const targetLabel = isLive ? "LIVE PRODUCTION DATABASE" : "TEST DATABASE";
  const connectionString = await resolveConnectionString(isLive);

  console.log(`\n========================================================================`);
  console.log(` AppForge Config Strict Schema Compatibility Auditor`);
  console.log(` Target: ${targetLabel}`);
  console.log(`========================================================================\n`);

  const client = new Client({ connectionString });
  await client.connect();

  // Enforce read-only transaction at the PostgreSQL engine level
  await client.query("BEGIN TRANSACTION READ ONLY;");
  console.log("🔒 Read-only transaction initiated (BEGIN TRANSACTION READ ONLY).\n");

  try {
    const res = await client.query(`
      SELECT id, name, config, published_config, updated_at
      FROM apps
      ORDER BY updated_at DESC;
    `);

    const apps = res.rows;
    console.log(`Loaded ${apps.length} application record(s).\n`);

    let validDraftCount = 0;
    let invalidDraftCount = 0;
    let validPubCount = 0;
    let invalidPubCount = 0;
    let publishedTotal = 0;

    const invalidKeyTallies = {};

    function auditConfig(cfgObj, contextLabel) {
      if (!cfgObj) return { valid: false, issues: ["Null or empty configuration"] };
      let parsed = cfgObj;
      if (typeof cfgObj === "string") {
        try {
          parsed = JSON.parse(cfgObj);
        } catch (e) {
          return { valid: false, issues: [`JSON parse error: ${e.message}`] };
        }
      }

      const issues = [];
      const appParse = AppConfigSchema.safeParse(parsed);
      if (!appParse.success) {
        for (const iss of appParse.error.issues) {
          const pathStr = iss.path.join(".") || "root";
          const msg = `${pathStr}: ${iss.message}`;
          issues.push(msg);
          invalidKeyTallies[msg] = (invalidKeyTallies[msg] || 0) + 1;
        }
      }

      // Deep validate every component node
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.pages)) {
        parsed.pages.forEach((page, pageIdx) => {
          if (Array.isArray(page?.components)) {
            page.components.forEach((comp, compIdx) => {
              const compRes = validateComponentNode(comp);
              if (!compRes.valid && compRes.issues) {
                for (const iss of compRes.issues) {
                  const pathStr = `pages[${pageIdx}].components[${compIdx}]<${comp?.type || "unknown"}>.${iss.path}`;
                  const msg = `${pathStr}: ${iss.message}`;
                  issues.push(msg);
                  invalidKeyTallies[msg] = (invalidKeyTallies[msg] || 0) + 1;
                }
              }
            });
          }
        });
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    }

    const appReports = [];

    for (const app of apps) {
      const isPublished = Boolean(app.published_config);
      if (isPublished) publishedTotal++;

      const draftAudit = auditConfig(app.config, "draft");
      const pubAudit = isPublished ? auditConfig(app.published_config, "published") : null;

      if (draftAudit.valid) validDraftCount++;
      else invalidDraftCount++;

      if (isPublished) {
        if (pubAudit?.valid) validPubCount++;
        else invalidPubCount++;
      }

      const allIssues = [
        ...draftAudit.issues.map((i) => `[Draft] ${i}`),
        ...(pubAudit ? pubAudit.issues.map((i) => `[Published] ${i}`) : []),
      ];

      appReports.push({
        id: app.id,
        name: app.name,
        published: isPublished ? "yes" : "no",
        draftValid: draftAudit.valid ? "VALID" : "INVALID",
        pubValid: isPublished ? (pubAudit?.valid ? "VALID" : "INVALID") : "N/A",
        issues: allIssues,
      });
    }

    // Print per-app breakdown
    for (const rep of appReports) {
      const statusSymbol =
        rep.draftValid === "VALID" && (rep.published === "no" || rep.pubValid === "VALID")
          ? "✓"
          : "⚠️";

      console.log(`${statusSymbol} App ID: ${rep.id} | Name: "${rep.name}" | Published: ${rep.published}`);
      console.log(`   Draft Config: ${rep.draftValid} | Published Config: ${rep.pubValid}`);
      if (rep.issues.length > 0) {
        console.log(`   Issues (${rep.issues.length}):`);
        for (const iss of rep.issues) {
          console.log(`     • ${iss}`);
        }
      }
      console.log("");
    }

    // Print summary counts
    console.log(`========================================================================`);
    console.log(` Audit Summary (${targetLabel})`);
    console.log(`========================================================================`);
    console.log(`Total Apps:             ${apps.length}`);
    console.log(`Published Apps:         ${publishedTotal}`);
    console.log(`Valid Draft Configs:    ${validDraftCount}`);
    console.log(`Invalid Draft Configs:  ${invalidDraftCount}`);
    if (publishedTotal > 0) {
      console.log(`Valid Published Config: ${validPubCount}`);
      console.log(`Invalid Published:      ${invalidPubCount}`);
    }
    console.log(`------------------------------------------------------------------------`);

    const issueKeys = Object.keys(invalidKeyTallies);
    if (issueKeys.length === 0) {
      console.log(`🎉 100% COMPATIBLE: All app configurations strictly satisfy the new schemas!`);
    } else {
      console.log(`⚠️ Unrecognized / Invalid Key Occurrences:`);
      for (const k of issueKeys) {
        console.log(`   - ${k} (count: ${invalidKeyTallies[k]})`);
      }
      console.log(`\nNext Steps:`);
      console.log(`1. If keys are legitimate user fields, declare them in lib/validation.ts.`);
      console.log(`2. If keys are legacy or malicious artifacts, run the stripping migration script:`);
      console.log(`   node scripts/migrate-strip-invalid-keys.mjs --dry-run`);
    }
  } finally {
    await client.query("ROLLBACK;");
    await client.end();
    console.log("\n🔒 Database connection closed. Zero writes performed.\n");
  }
}

runAudit().catch((err) => {
  console.error("Audit failed with error:", err);
  process.exit(1);
});
