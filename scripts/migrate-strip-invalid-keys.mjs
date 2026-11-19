#!/usr/bin/env node
import fs from "fs";
import path from "path";
import pg from "pg";
import { AppConfigSchema, validateComponentNode, ComponentSchemas } from "../lib/validation.ts";

const { Client } = pg;

const isApply = process.argv.includes("--apply");
const isLive = process.argv.includes("--live");
const isDryRun = !isApply;

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

let connectionString = "";
let targetLabel = "";

if (isLive) {
  targetLabel = "LIVE PRODUCTION DATABASE";
  connectionString =
    process.env.LIVE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    envLocal.DATABASE_URL ||
    envLocal.LIVE_DATABASE_URL ||
    envLocal.POSTGRES_URL;

  if (!connectionString) {
    console.error("❌ LIVE_DATABASE_URL or DATABASE_URL not found.");
    process.exit(1);
  }
} else {
  targetLabel = "TEST DATABASE";
  connectionString = process.env.TEST_DATABASE_URL || envTest.TEST_DATABASE_URL;
  if (!connectionString) {
    console.error("❌ TEST_DATABASE_URL not found.");
    process.exit(1);
  }
}

console.log(`\n========================================================================`);
console.log(` AppForge Config Sanitizer & Key Stripper`);
console.log(` Target: ${targetLabel} | Mode: ${isDryRun ? "DRY-RUN (Safe, No writes)" : "APPLY"}`);
console.log(`========================================================================\n`);

function stripUnknownComponentKeys(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return node;
  const raw = { ...node };
  const type = raw.type;
  if (!type || typeof type !== "string") return raw;

  const schema = ComponentSchemas[type];
  if (!schema) return raw;

  const cleaned = {};
  // Check known shape keys if object schema
  const shape = schema._def?.shape?.() || schema._def?.shape || {};
  const knownKeys = new Set(["type", ...Object.keys(shape)]);

  const strippedKeys = [];
  for (const [k, v] of Object.entries(raw)) {
    if (knownKeys.has(k)) {
      cleaned[k] = v;
    } else {
      strippedKeys.push(k);
    }
  }

  // Recurse into Card content/footer or Grid items
  if (Array.isArray(cleaned.content)) {
    cleaned.content = cleaned.content.map(stripUnknownComponentKeys);
  }
  if (Array.isArray(cleaned.footer)) {
    cleaned.footer = cleaned.footer.map(stripUnknownComponentKeys);
  }
  if (Array.isArray(cleaned.items)) {
    cleaned.items = cleaned.items.map(stripUnknownComponentKeys);
  }

  return { cleaned, strippedKeys };
}

function sanitizeConfig(cfg) {
  if (!cfg) return { changed: false, config: cfg, stripped: [] };
  let parsed = cfg;
  if (typeof cfg === "string") {
    try {
      parsed = JSON.parse(cfg);
    } catch {
      return { changed: false, config: cfg, stripped: [] };
    }
  }

  let changed = false;
  const allStripped = [];

  const appShape = AppConfigSchema._def?.shape?.() || AppConfigSchema._def?.shape || {};
  const knownAppKeys = new Set(Object.keys(appShape));

  const cleanedApp = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (knownAppKeys.has(k)) {
      cleanedApp[k] = v;
    } else {
      changed = true;
      allStripped.push(`app.${k}`);
    }
  }

  if (Array.isArray(cleanedApp.pages)) {
    cleanedApp.pages = cleanedApp.pages.map((page, pIdx) => {
      const pageShape = { components: true, title: true, id: true };
      const cleanedPage = {};
      for (const [k, v] of Object.entries(page)) {
        if (pageShape[k]) {
          cleanedPage[k] = v;
        } else {
          changed = true;
          allStripped.push(`pages[${pIdx}].${k}`);
        }
      }

      if (Array.isArray(cleanedPage.components)) {
        cleanedPage.components = cleanedPage.components.map((comp, cIdx) => {
          const res = stripUnknownComponentKeys(comp);
          if (res.strippedKeys && res.strippedKeys.length > 0) {
            changed = true;
            for (const sk of res.strippedKeys) {
              allStripped.push(`pages[${pIdx}].components[${cIdx}]<${comp.type}>.${sk}`);
            }
          }
          return res.cleaned || comp;
        });
      }

      return cleanedPage;
    });
  }

  return {
    changed,
    config: cleanedApp,
    stripped: allStripped,
  };
}

async function runMigration() {
  const client = new Client({ connectionString });
  await client.connect();

  if (isDryRun) {
    await client.query("BEGIN TRANSACTION READ ONLY;");
  } else {
    await client.query("BEGIN;");
  }

  try {
    const res = await client.query("SELECT id, name, config, published_config FROM apps;");
    const apps = res.rows;
    let appsModified = 0;

    for (const app of apps) {
      const draftSanitize = sanitizeConfig(app.config);
      const pubSanitize = app.published_config ? sanitizeConfig(app.published_config) : { changed: false };

      if (draftSanitize.changed || pubSanitize.changed) {
        appsModified++;
        console.log(`🛠️ App ID: ${app.id} ("${app.name}")`);
        if (draftSanitize.changed) {
          console.log(`   Stripped draft keys:`, draftSanitize.stripped.join(", "));
        }
        if (pubSanitize.changed) {
          console.log(`   Stripped published keys:`, pubSanitize.stripped.join(", "));
        }

        if (!isDryRun) {
          await client.query(
            `UPDATE apps SET config = $1, published_config = $2, updated_at = NOW() WHERE id = $3;`,
            [
              JSON.stringify(draftSanitize.config),
              app.published_config ? JSON.stringify(pubSanitize.config) : null,
              app.id,
            ]
          );
        }
      }
    }

    if (isDryRun) {
      console.log(`\n[DRY RUN SUMMARY] Found ${appsModified} app(s) with keys to strip. Zero changes applied.`);
      console.log(`To apply these changes, rerun with:\n  node scripts/migrate-strip-invalid-keys.mjs ${isLive ? "--live " : ""}--apply\n`);
      await client.query("ROLLBACK;");
    } else {
      await client.query("COMMIT;");
      console.log(`\n✅ Successfully updated ${appsModified} app(s) in database.\n`);
    }
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
