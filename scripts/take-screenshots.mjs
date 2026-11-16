import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const outDir = resolve('.screenshots');
mkdirSync(outDir, { recursive: true });

async function capture() {
  const browser = await Browser.launch({ width: 1440, height: 900 });
  console.log('Browser launched successfully');
  const page = await browser.newPage({ width: 1440, height: 900 });

  // 1. Desktop captures (1440x900)
  const desktopTargets = [
    { url: 'http://localhost:3000', name: 'shell-landing-desktop' },
    { url: 'http://localhost:3000/dashboard', name: 'dashboard-desktop' },
    { url: 'http://localhost:3000/builder/demo', name: 'builder-desktop' }
  ];

  for (const t of desktopTargets) {
    console.log(`[Desktop] Navigating to ${t.url}...`);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(t.url, { timeoutMs: 15000, settleMs: 1000 });

    // Dark
    await page.eval(`
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    `);
    await sleep(300);
    await page.screenshot({ path: join(outDir, `${t.name}-dark.jpg`), format: 'jpeg', quality: 85 });

    // Light
    await page.eval(`
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    `);
    await sleep(300);
    await page.screenshot({ path: join(outDir, `${t.name}-light.jpg`), format: 'jpeg', quality: 85 });
  }

  // 2. Mobile captures (375x812)
  console.log('[Mobile] Switching viewport to 375x812...');
  await page.setViewport({ width: 375, height: 812, mobile: true });

  const mobileTargets = [
    { url: 'http://localhost:3000', name: 'shell-landing-mobile' },
    { url: 'http://localhost:3000/dashboard', name: 'dashboard-mobile' },
    { url: 'http://localhost:3000/builder/demo', name: 'builder-mobile' }
  ];

  for (const t of mobileTargets) {
    console.log(`[Mobile] Navigating to ${t.url}...`);
    await page.goto(t.url, { timeoutMs: 15000, settleMs: 1000 });

    // Dark
    await page.eval(`
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    `);
    await sleep(300);
    await page.screenshot({ path: join(outDir, `${t.name}-dark.jpg`), format: 'jpeg', quality: 85 });

    // Light
    await page.eval(`
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    `);
    await sleep(300);
    await page.screenshot({ path: join(outDir, `${t.name}-light.jpg`), format: 'jpeg', quality: 85 });
  }

  // 3. Mobile Nav Drawer open captures (375x812)
  console.log('[Mobile Nav Drawer] Capturing open nav drawer...');
  await page.goto('http://localhost:3000', { timeoutMs: 15000, settleMs: 1000 });

  // Dark drawer open
  await page.eval(`
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    const btn = document.querySelector('button[aria-label="Toggle Menu"]');
    if (btn) btn.click();
  `);
  await sleep(400);
  await page.screenshot({ path: join(outDir, `nav-drawer-mobile-dark.jpg`), format: 'jpeg', quality: 85 });

  // Light drawer open
  await page.eval(`
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  `);
  await sleep(400);
  await page.screenshot({ path: join(outDir, `nav-drawer-mobile-light.jpg`), format: 'jpeg', quality: 85 });

  // 4. Focus order & Ring audit
  const focusAudit = await page.eval(`
    (() => {
      const focusable = Array.from(document.querySelectorAll('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
        });
      
      const sequence = focusable.map(el => ({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.getAttribute('aria-label') || el.name || '').trim().slice(0, 30),
        className: el.className
      }));

      // Focus first interactive button to verify ring style
      const firstBtn = focusable.find(el => el.tagName === 'BUTTON' || el.tagName === 'A');
      let ringDetails = null;
      if (firstBtn) {
        firstBtn.focus();
        const style = window.getComputedStyle(firstBtn);
        ringDetails = {
          outline: style.outline,
          outlineColor: style.outlineColor,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow
        };
      }

      return { totalFocusable: focusable.length, sampleSequence: sequence.slice(0, 8), ringDetails };
    })()
  `);
  console.log('Focus Audit Result:', JSON.stringify(focusAudit, null, 2));

  await page.close();
  await browser.close();
  console.log('All screenshots and audits completed successfully in .screenshots/');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
