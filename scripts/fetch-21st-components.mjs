#!/usr/bin/env node

/**
 * scripts/fetch-21st-components.mjs
 * 
 * Fetches and verifies components from 21st.dev registry.
 * - Loads API_KEY_21ST from .env.local (dotenv)
 * - Exits with a clear message if API_KEY_21ST is missing or empty
 * - Strictly prevents logging, echoing, or leaking the API key (using split/join redaction)
 * - Requires exact "author/slug" arguments (no fuzzy search, no results[0] fallback)
 * - Strict license allowlist (MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC); unknown/missing = SKIP
 * - Writes to components/vendor/21st/<slug>/ and strictly refuses to overwrite existing files
 * - Audits downloaded files for network calls, eval/Function, dangerouslySetInnerHTML, and dynamic scripts
 * - Reports declared dependencies without installing anything
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// 1. Load environment from .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, quiet: true });
}

const apiKey = (process.env.API_KEY_21ST || '').trim();

/**
 * Redact the API key safely without RegExp to avoid syntax crashes if the key contains regex symbols.
 */
function redactKey(str) {
  if (!apiKey || typeof str !== 'string') return str;
  return str.split(apiKey).join('[REDACTED]');
}

// 2. Strict validation: Exit if key is missing or empty
if (!apiKey) {
  console.error('\n❌ [Error] API_KEY_21ST is missing or empty in .env.local.');
  console.error('Please add your 21st.dev API key to .env.local:');
  console.error('  API_KEY_21ST=21st_sk_...\n');
  process.exit(1);
}

// 3. Strict Identity Validation: Require exact author/slug arguments
const componentArgs = process.argv.slice(2);
if (componentArgs.length === 0) {
  console.error('\n❌ [Error] No component names specified.');
  console.error('Usage: node scripts/fetch-21st-components.mjs <author>/<slug> ...');
  console.error('Example: node scripts/fetch-21st-components.mjs dqnamo/animated-sparkline dqnamo/logo-trace-loader\n');
  process.exit(1);
}

const IDENTIFIER_REGEX = /^@?([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/;
const parsedTargets = [];

for (const arg of componentArgs) {
  const match = arg.match(IDENTIFIER_REGEX);
  if (!match) {
    console.error(`\n❌ [Error] Invalid component identifier: "${arg}".`);
    console.error('Components must be specified strictly as "author/slug" (e.g. "dqnamo/animated-sparkline").');
    console.error('Fuzzy matching and search fallbacks are strictly disabled.\n');
    process.exit(1);
  }
  parsedTargets.push({ raw: arg, author: match[1], slug: match[2] });
}

// 4. License Allowlist
const ALLOWED_LICENSES = [
  'MIT',
  'Apache-2.0',
  'Apache 2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC'
];

function checkLicenseAllowlist(rawLicense) {
  if (!rawLicense || typeof rawLicense !== 'string' || rawLicense.trim().length === 0) {
    return { allowed: false, reason: 'License missing or unknown' };
  }
  const clean = rawLicense.trim();
  const isMatch = ALLOWED_LICENSES.some((allowed) => clean.toLowerCase() === allowed.toLowerCase());
  if (isMatch) {
    return { allowed: true, license: clean };
  }
  return { allowed: false, reason: `License "${clean}" is not on allowlist (${ALLOWED_LICENSES.join(', ')})` };
}

// Base URLs
const API_V1_BASE = 'https://21st.dev/api/v1';
const REGISTRY_BASE = 'https://21st.dev/r';

/**
 * Authenticated fetch with zero key leakage
 */
async function fetchComponentData(author, slug) {
  // Method 1: Try documented OpenAPI /api/v1/components/install/{author}/{slug}
  const v1Url = `${API_V1_BASE}/components/install/${encodeURIComponent(author)}/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(v1Url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'AppForge-Component-Fetcher/2.0'
      }
    });

    if (res.status === 401) {
      console.error(`\n❌ [401 Unauthorized] The provided API_KEY_21ST was rejected by 21st.dev.`);
      console.error('Please verify your key at https://21st.dev/mcp or https://21st.dev/settings/api-keys.\n');
      return { ok: false, status: 401, error: 'Unauthorized' };
    }

    if (res.ok) {
      const data = await res.json();
      return { ok: true, data, source: 'api/v1' };
    }
  } catch (err) {
    // Failover to registry endpoint
  }

  // Method 2: Fallback to shadcn registry endpoint /r/{author}/{slug}
  const rUrl = `${REGISTRY_BASE}/${encodeURIComponent(author)}/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(rUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'AppForge-Component-Fetcher/2.0'
      }
    });

    if (res.status === 401 || res.status === 403) {
      console.error(`\n❌ [${res.status} Authentication Failed] 21st.dev rejected access to ${author}/${slug}.`);
      return { ok: false, status: res.status, error: 'Authentication Required' };
    }

    if (res.ok) {
      const data = await res.json();
      return { ok: true, data, source: 'registry' };
    }

    const errText = await res.text().catch(() => '');
    return { ok: false, status: res.status, error: redactKey(errText || res.statusText) };
  } catch (err) {
    return { ok: false, status: 500, error: redactKey(err?.message || String(err)) };
  }
}

/**
 * Perform static code audit on component file contents
 */
function auditFileContent(content, relativePath) {
  const findings = [];

  // 1. Network calls
  const netPatterns = [
    { regex: /\bfetch\s*\(/g, name: 'fetch() call' },
    { regex: /\baxios\b/g, name: 'axios reference' },
    { regex: /\bXMLHttpRequest\b/g, name: 'XMLHttpRequest' },
    { regex: /\bWebSocket\b/g, name: 'WebSocket' },
    { regex: /\bnavigator\.sendBeacon\b/g, name: 'navigator.sendBeacon' },
    { regex: /https?:\/\/(?!www\.w3\.org)[^\s"'`]+/g, name: 'External HTTP/S URL' }
  ];

  for (const p of netPatterns) {
    const matches = [...content.matchAll(p.regex)];
    if (matches.length > 0) {
      findings.push({ category: 'Network Call', name: p.name, count: matches.length });
    }
  }

  // 2. eval / new Function
  const execPatterns = [
    { regex: /\beval\s*\(/g, name: 'eval()' },
    { regex: /new\s+Function\s*\(/g, name: 'new Function()' }
  ];

  for (const p of execPatterns) {
    const matches = [...content.matchAll(p.regex)];
    if (matches.length > 0) {
      findings.push({ category: 'Dynamic Execution', name: p.name, count: matches.length });
    }
  }

  // 3. dangerouslySetInnerHTML
  const htmlMatches = [...content.matchAll(/dangerouslySetInnerHTML/g)];
  if (htmlMatches.length > 0) {
    findings.push({ category: 'Raw HTML', name: 'dangerouslySetInnerHTML', count: htmlMatches.length });
  }

  // 4. Dynamic script loading
  const scriptPatterns = [
    { regex: /document\.createElement\s*\(\s*['"]script['"]\s*\)/g, name: "document.createElement('script')" },
    { regex: /import\s*\(/g, name: 'dynamic import()' },
    { regex: /from\s+['"]next\/script['"]/g, name: 'next/script' }
  ];

  for (const p of scriptPatterns) {
    const matches = [...content.matchAll(p.regex)];
    if (matches.length > 0) {
      findings.push({ category: 'Dynamic Script', name: p.name, count: matches.length });
    }
  }

  return findings;
}

/**
 * Scan file contents for embedded license headers if missing from payload
 */
function detectLicenseInContent(files) {
  for (const f of files) {
    const content = f.content || '';
    const match = content.match(/@license\s+([A-Za-z0-9_.-]+)|License:\s*([A-Za-z0-9_.-]+)|(MIT|Apache-2\.0|BSD-2-Clause|BSD-3-Clause|ISC)\s+License/i);
    if (match) {
      return match[1] || match[2] || match[3];
    }
  }
  return null;
}

async function main() {
  console.log(`\n============================================================`);
  console.log(` 21st.dev Component Fetcher & Security Auditor — AppForge`);
  console.log(` Targets: ${parsedTargets.map((t) => `${t.author}/${t.slug}`).join(', ')}`);
  console.log(` Vendor destination: components/vendor/21st/<slug>/`);
  console.log(`============================================================\n`);

  const installed = [];
  const skipped = [];
  const failed = [];

  for (const target of parsedTargets) {
    const { author, slug, raw } = target;
    console.log(`\n▶ Processing "${author}/${slug}"...`);

    const result = await fetchComponentData(author, slug);
    if (!result.ok) {
      console.error(`   ❌ Failed to retrieve component data: ${result.error}`);
      failed.push({ target: raw, reason: result.error });
      continue;
    }

    const payload = result.data;
    const files = payload.files || [];

    if (files.length === 0) {
      console.warn(`   ⚠️  No files found in payload for "${author}/${slug}".`);
      failed.push({ target: raw, reason: 'Empty files array in payload' });
      continue;
    }

    // 1. License Verification: Never default to MIT. Must be on allowlist.
    const explicitLicense = payload.license || payload.component?.license || payload.meta?.license || detectLicenseInContent(files);
    const licenseCheck = checkLicenseAllowlist(explicitLicense);

    console.log(`   ┌────────────────────────────────────────────────────────`);
    console.log(`   │ Component:   ${payload.name || slug} (${author}/${slug})`);
    console.log(`   │ Author:      ${payload.author || author}`);
    console.log(`   │ License:     ${explicitLicense || 'MISSING / UNKNOWN'}`);
    console.log(`   │ Source:      ${result.source}`);
    console.log(`   └────────────────────────────────────────────────────────`);

    if (!licenseCheck.allowed) {
      console.warn(`   ⚠️  [SKIPPED] ${licenseCheck.reason}.`);
      console.warn(`       Requires explicit user approval before installation.`);
      skipped.push({ target: raw, reason: licenseCheck.reason });
      continue;
    }

    // Check for Paid/Pro indicators
    const price = payload.price || 0;
    const isPro = Boolean(
      payload.is_pro ||
      payload.isPro ||
      price > 0 ||
      payload.payment_url ||
      payload.tags?.includes('pro') ||
      payload.tags?.includes('paid')
    );

    if (isPro) {
      console.warn(`   ⚠️  [SKIPPED] Paid/Pro component detected (price: ${price}). Free reuse only.`);
      skipped.push({ target: raw, reason: 'Paid / Pro component' });
      continue;
    }

    // 2. Destination directory: components/vendor/21st/<slug>/
    const targetDir = path.resolve(process.cwd(), 'components', 'vendor', '21st', slug);

    // 3. Pre-flight Overwrite Check: Refuse to overwrite existing files
    let overwriteConflict = false;
    for (const f of files) {
      const fileName = path.basename(f.path || `${slug}.tsx`);
      const targetFilePath = path.join(targetDir, fileName);
      if (fs.existsSync(targetFilePath)) {
        console.warn(`   ⚠️  [REFUSED] File already exists: components/vendor/21st/${slug}/${fileName}. Refusing to overwrite.`);
        overwriteConflict = true;
      }
    }

    if (overwriteConflict) {
      console.error(`   ❌ [SKIPPED] "${slug}" has conflicting existing files. Refusing to overwrite.`);
      skipped.push({ target: raw, reason: 'File already exists in vendor directory' });
      continue;
    }

    // Create target directory
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write files and run security audit
    const writtenFiles = [];
    const auditReports = [];

    for (const f of files) {
      const fileName = path.basename(f.path || `${slug}.tsx`);
      const targetFilePath = path.join(targetDir, fileName);

      // Write file
      fs.writeFileSync(targetFilePath, f.content, 'utf8');
      writtenFiles.push(fileName);
      console.log(`   ✓ Saved: components/vendor/21st/${slug}/${fileName}`);

      // Static code security audit
      const findings = auditFileContent(f.content, fileName);
      auditReports.push({ file: fileName, findings });
    }

    // Print Security Audit Results
    console.log(`   🛡️  Security Audit Report for "${slug}":`);
    for (const report of auditReports) {
      if (report.findings.length === 0) {
        console.log(`      ✓ ${report.file}: PASS (Clean: 0 network calls, 0 eval/Function, 0 dangerouslySetInnerHTML, 0 dynamic scripts)`);
      } else {
        console.warn(`      ⚠️  ${report.file}: ATTENTION REQUIRED`);
        for (const finding of report.findings) {
          console.warn(`         - [${finding.category}] ${finding.name} (${finding.count} occurrence(s))`);
        }
      }
    }

    // Report declared dependencies
    const deps = payload.dependencies || [];
    const regDeps = payload.registry_dependencies || payload.registryDependencies || [];

    if (deps.length > 0) {
      console.log(`   📦 Declared NPM Dependencies: ${deps.join(', ')}`);
      console.log(`      (Note: Not installed automatically. Sizes and licenses must be reviewed first.)`);
    } else {
      console.log(`   📦 Declared NPM Dependencies: None`);
    }

    if (regDeps.length > 0) {
      console.log(`   🧩 Declared Registry Dependencies: ${regDeps.join(', ')}`);
    }

    installed.push({
      target: raw,
      slug,
      author: payload.author || author,
      license: licenseCheck.license,
      files: writtenFiles,
      dependencies: deps,
      registryDependencies: regDeps,
      auditReports
    });
  }

  // Summary
  console.log(`\n============================================================`);
  console.log(` Execution Summary:`);
  console.log(`   Installed: ${installed.length}`);
  console.log(`   Skipped:   ${skipped.length}`);
  console.log(`   Failed:    ${failed.length}`);
  console.log(`============================================================\n`);

  if (installed.length > 0) {
    console.log(`Installed Vendor Components:`);
    for (const item of installed) {
      console.log(` • ${item.target} (License: ${item.license}) -> components/vendor/21st/${item.slug}/ [${item.files.join(', ')}]`);
    }
    console.log('');
  }

  if (skipped.length > 0) {
    console.log(`Skipped Components:`);
    for (const item of skipped) {
      console.log(` • ${item.target}: ${item.reason}`);
    }
    console.log('');
  }

  if (failed.length > 0) {
    console.log(`Failed Components:`);
    for (const item of failed) {
      console.log(` • ${item.target}: ${item.reason}`);
    }
    console.log('');
  }
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', redactKey(err?.message || String(err)));
  process.exit(1);
});
