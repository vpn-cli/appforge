import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const outDir = resolve('.screenshots');
mkdirSync(outDir, { recursive: true });

async function capture() {
  const browser = await Browser.launch({ width: 1440, height: 900 });
  console.log('Browser launched successfully');
  const page = await browser.newPage({ width: 1440, height: 900 });

  // 1. Desktop full views (Dashboard, Builder, Shell)
  const views = [
    { url: 'http://localhost:3000/dashboard', name: 'dashboard-desktop' },
    { url: 'http://localhost:3000/builder/demo', name: 'builder-desktop' },
    { url: 'http://localhost:3000/test-renderers', name: 'renderers-showcase' }
  ];

  for (const v of views) {
    console.log(`Navigating to ${v.url}...`);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(v.url, { timeoutMs: 15000, settleMs: 1000 });

    // Dark
    await page.eval(`
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    `);
    await sleep(300);
    await page.screenshot({ path: join(outDir, `${v.name}-dark.jpg`), format: 'jpeg', quality: 85 });

    // Light
    await page.eval(`
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    `);
    await sleep(300);
    await page.screenshot({ path: join(outDir, `${v.name}-light.jpg`), format: 'jpeg', quality: 85 });
  }

  // 2. Individual 5 States of DataTable (Scoped screenshots)
  console.log('Capturing 5 individual DataTable states on test page...');
  await page.setViewport({ width: 1440, height: 2200 });
  await page.goto('http://localhost:3000/test-renderers', { timeoutMs: 15000, settleMs: 1000 });

  const stateSections = [
    { id: 'state-loading', name: 'state-1-loading' },
    { id: 'state-loaded', name: 'state-2-loaded' },
    { id: 'state-empty', name: 'state-3-empty' },
    { id: 'state-error', name: 'state-4-error' },
    { id: 'state-degraded', name: 'state-5-degraded' },
  ];

  for (const s of stateSections) {
    // Dark
    await page.eval(`
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    `);
    await sleep(200);
    const darkBox = await page.eval(`
      (() => {
        const el = document.getElementById('${s.id}');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)), width: Math.round(r.width), height: Math.round(r.height) };
      })()
    `);
    if (darkBox) {
      await page.screenshot({
        path: join(outDir, `${s.name}-dark.jpg`),
        clip: darkBox,
        format: 'jpeg',
        quality: 90
      });
    }

    // Light
    await page.eval(`
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    `);
    await sleep(200);
    const lightBox = await page.eval(`
      (() => {
        const el = document.getElementById('${s.id}');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)), width: Math.round(r.width), height: Math.round(r.height) };
      })()
    `);
    if (lightBox) {
      await page.screenshot({
        path: join(outDir, `${s.name}-light.jpg`),
        clip: lightBox,
        format: 'jpeg',
        quality: 90
      });
    }
  }

  // 3. Mobile captures (375x812)
  console.log('[Mobile] Capturing mobile views...');
  await page.setViewport({ width: 375, height: 812, mobile: true });
  await page.goto('http://localhost:3000/dashboard', { timeoutMs: 15000, settleMs: 1000 });
  await page.eval(`
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  `);
  await sleep(300);
  await page.screenshot({ path: join(outDir, 'dashboard-mobile-dark.jpg'), format: 'jpeg', quality: 85 });

  await page.eval(`
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  `);
  await sleep(300);
  await page.screenshot({ path: join(outDir, 'dashboard-mobile-light.jpg'), format: 'jpeg', quality: 85 });

  await page.close();
  await browser.close();
  console.log('All state screenshots and audits completed successfully in .screenshots/');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
