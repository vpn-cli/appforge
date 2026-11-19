#!/usr/bin/env node

/**
 * scripts/fetch-21st-components.mjs
 * 
 * Fetches and verifies components from 21st.dev registry.
 * - Loads API_KEY_21ST from .env.local
 * - Exits with a clear message if API_KEY_21ST is missing or empty
 * - Strictly prevents logging, echoing, or leaking the API key
 * - Takes component names as CLI arguments and fetches only those
 * - Displays author and license terms before installing
 * - Skips components that are paid/pro or do not allow reuse
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

// 2. Strict validation: Exit if key is missing or empty
if (!apiKey) {
  console.error('\n❌ [Error] API_KEY_21ST is missing or empty in .env.local.');
  console.error('Please add your 21st.dev API key to .env.local:');
  console.error('  API_KEY_21ST=21st_sk_...\n');
  process.exit(1);
}

// 3. Arguments: Component names to fetch
const componentArgs = process.argv.slice(2);
if (componentArgs.length === 0) {
  console.error('\n❌ [Error] No component names specified.');
  console.error('Usage: node scripts/fetch-21st-components.mjs <component-name-1> <component-name-2> ...');
  console.error('Example: node scripts/fetch-21st-components.mjs animated-sparkline logo-trace-loader\n');
  process.exit(1);
}

// Destination directory for downloaded UI components
const UI_DIR = path.resolve(process.cwd(), 'components', 'ui');
if (!fs.existsSync(UI_DIR)) {
  fs.mkdirSync(UI_DIR, { recursive: true });
}

const API_BASE_URL = 'https://21st.dev/api/v1';

/**
 * Execute an authenticated fetch without leaking headers or sensitive data.
 */
async function secureApiFetch(endpointPath) {
  const url = `${API_BASE_URL}${endpointPath}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'AppForge-Component-Fetcher/1.0'
      }
    });

    if (res.status === 401) {
      console.error(`\n❌ [401 Unauthorized] The provided API_KEY_21ST was rejected by 21st.dev.`);
      console.error('Please verify your key at https://21st.dev/mcp or https://21st.dev/settings/api-keys.\n');
      return { ok: false, status: 401, error: 'Unauthorized' };
    }

    if (res.status === 429) {
      console.error(`\n❌ [429 Rate Limited] Request limit reached on 21st.dev. Please wait and retry.\n`);
      return { ok: false, status: 429, error: 'Rate Limited' };
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: errText || res.statusText };
    }

    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (err) {
    // Sanitize any potential appearance of apiKey in error message
    const cleanMsg = (err?.message || String(err)).replace(new RegExp(apiKey, 'g'), '[REDACTED]');
    return { ok: false, status: 500, error: cleanMsg };
  }
}

/**
 * Check if the license explicitly forbids reuse.
 */
function isRestrictedLicense(licenseText) {
  if (!licenseText) return false;
  const lower = licenseText.toLowerCase();
  const restrictedKeywords = [
    'proprietary',
    'all rights reserved',
    'commercial only',
    'paid license',
    'no distribution',
    'closed source'
  ];
  return restrictedKeywords.some((kw) => lower.includes(kw));
}

/**
 * Main fetch & install orchestrator
 */
async function main() {
  console.log(`\n============================================================`);
  console.log(` 21st.dev Component Fetcher — AppForge`);
  console.log(` Components to process: ${componentArgs.join(', ')}`);
  console.log(`============================================================\n`);

  const installed = [];
  const skipped = [];
  const failed = [];

  for (const componentName of componentArgs) {
    console.log(`\n▶ Processing "${componentName}"...`);

    let author = '';
    let slug = '';
    let matchMeta = null;

    if (componentName.includes('/')) {
      const parts = componentName.replace(/^@/, '').split('/');
      author = parts[0];
      slug = parts[1];
    } else {
      // Search for the component via public search
      const searchRes = await secureApiFetch(`/components/search?q=${encodeURIComponent(componentName)}&scope=public`);
      if (!searchRes.ok) {
        console.error(`   ❌ Failed to query registry for "${componentName}": ${searchRes.error}`);
        failed.push({ name: componentName, reason: searchRes.error });
        continue;
      }

      const results = searchRes.data?.results || [];
      if (results.length === 0) {
        console.warn(`   ⚠️  No component matching "${componentName}" found on 21st.dev.`);
        failed.push({ name: componentName, reason: 'Not found in search' });
        continue;
      }

      // Find exact or closest match
      matchMeta = results.find(
        (r) => r.slug?.toLowerCase() === componentName.toLowerCase() || r.name?.toLowerCase() === componentName.toLowerCase()
      ) || results[0];

      author = matchMeta.author;
      slug = matchMeta.slug;
    }

    if (!author || !slug) {
      console.error(`   ❌ Unable to resolve author/slug for "${componentName}".`);
      failed.push({ name: componentName, reason: 'Invalid author/slug resolution' });
      continue;
    }

    // Fetch the installation payload
    const installRes = await secureApiFetch(`/components/install/${encodeURIComponent(author)}/${encodeURIComponent(slug)}`);
    if (!installRes.ok) {
      console.error(`   ❌ Failed to fetch install payload for "${author}/${slug}": ${installRes.error}`);
      failed.push({ name: componentName, reason: installRes.error });
      continue;
    }

    const payload = installRes.data;
    const itemAuthor = payload.author || author;
    const itemLicense = payload.license || matchMeta?.license || 'MIT / Open Source';
    const itemPrice = payload.price || 0;
    const itemTags = payload.tags || matchMeta?.tags || [];
    const isPro = Boolean(
      payload.is_pro ||
      payload.isPro ||
      itemPrice > 0 ||
      payload.payment_url ||
      itemTags.includes('pro') ||
      itemTags.includes('paid')
    );

    // 4. Print author and license terms
    console.log(`   ┌────────────────────────────────────────────────────────`);
    console.log(`   │ Component:   ${payload.name || slug} (${author}/${slug})`);
    console.log(`   │ Author:      ${itemAuthor}`);
    console.log(`   │ License:     ${itemLicense}`);
    console.log(`   │ Tier:        ${isPro ? 'PAID / PRO' : 'FREE / COMMUNITY'}`);
    if (itemPrice > 0) {
      console.log(`   │ Price:       $${itemPrice}`);
    }
    console.log(`   └────────────────────────────────────────────────────────`);

    // 5. Skip paid/pro or restricted reuse components
    if (isPro) {
      console.warn(`   ⚠️  [SKIPPED] "${slug}" is a Paid/Pro component. AppForge only installs free/open components.`);
      skipped.push({ name: componentName, reason: 'Paid / Pro component' });
      continue;
    }

    if (isRestrictedLicense(itemLicense)) {
      console.warn(`   ⚠️  [SKIPPED] "${slug}" license (${itemLicense}) does not permit open reuse.`);
      skipped.push({ name: componentName, reason: `Restricted license: ${itemLicense}` });
      continue;
    }

    const files = payload.files || [];
    if (files.length === 0) {
      console.warn(`   ⚠️  No files returned for component "${slug}".`);
      failed.push({ name: componentName, reason: 'Empty file list' });
      continue;
    }

    // Write component files
    const writtenFiles = [];
    for (const f of files) {
      const fileName = path.basename(f.path || `${slug}.tsx`);
      const filePath = path.join(UI_DIR, fileName);
      fs.writeFileSync(filePath, f.content, 'utf8');
      writtenFiles.push(fileName);
      console.log(`   ✓ Saved: components/ui/${fileName}`);
    }

    const deps = payload.dependencies || [];
    const regDeps = payload.registry_dependencies || [];

    if (deps.length > 0) {
      console.log(`   📦 NPM Dependencies: ${deps.join(', ')}`);
    }
    if (regDeps.length > 0) {
      console.log(`   🧩 Registry Dependencies: ${regDeps.join(', ')}`);
    }

    installed.push({
      name: componentName,
      slug,
      author: itemAuthor,
      license: itemLicense,
      files: writtenFiles,
      dependencies: deps,
      registryDependencies: regDeps
    });
  }

  // Summary
  console.log(`\n============================================================`);
  console.log(` Summary:`);
  console.log(`   Installed: ${installed.length}`);
  console.log(`   Skipped:   ${skipped.length}`);
  console.log(`   Failed:    ${failed.length}`);
  console.log(`============================================================\n`);

  if (installed.length > 0) {
    console.log(`Installed components:`);
    for (const item of installed) {
      console.log(` - ${item.name} (by ${item.author}, license: ${item.license}) -> ${item.files.join(', ')}`);
    }
    console.log('');
  }

  if (skipped.length > 0) {
    console.log(`Skipped components:`);
    for (const item of skipped) {
      console.log(` - ${item.name}: ${item.reason}`);
    }
    console.log('');
  }

  if (failed.length > 0) {
    console.log(`Failed components:`);
    for (const item of failed) {
      console.log(` - ${item.name}: ${item.reason}`);
    }
    console.log('');
  }
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', err.message || err);
  process.exit(1);
});
