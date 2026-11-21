import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

// Attempt to load .env.local first, then .env if process.loadEnvFile is available
const envFiles = [".env", ".env.local"];
for (const file of envFiles) {
  const filePath = path.resolve(cwd, file);
  if (fs.existsSync(filePath)) {
    try {
      process.loadEnvFile(filePath);
    } catch {
      // Fallback manual parser if process.loadEnvFile fails
      const content = fs.readFileSync(filePath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

const rawUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || process.env.TEST_SUPABASE_URL || "";
let host = "not configured";

if (rawUrl) {
  try {
    host = new URL(rawUrl).host;
  } catch {
    host = rawUrl;
  }
}

console.log(`\x1b[36m[appforge]\x1b[0m Supabase host: \x1b[1m${host}\x1b[0m`);
if (host.includes("upljqampxcmhqjszatrp")) {
  console.log(`\x1b[31m[appforge] ⚠️  WARNING: Connected to PRODUCTION Supabase project (upljqampxcmhqjszatrp)!\x1b[0m`);
} else if (host !== "not configured") {
  console.log(`\x1b[32m[appforge] ✓ Connected to isolated environment (${host})\x1b[0m`);
}
