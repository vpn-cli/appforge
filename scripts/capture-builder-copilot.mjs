import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const outDir = resolve('.screenshots');
mkdirSync(outDir, { recursive: true });

async function capture() {
  const browser = await Browser.launch({ width: 1440, height: 900 });
  console.log('Browser launched successfully');
  const page = await browser.newPage({ width: 1440, height: 900 });

  const widths = [1440, 1280];
  const states = [
    { name: 'open', shouldOpen: true },
    { name: 'closed', shouldOpen: false },
  ];

  for (const w of widths) {
    for (const st of states) {
      console.log(`Setting viewport to ${w}x900 for state: ${st.name}...`);
      await page.setViewport({ width: w, height: 900 });
      await page.goto('http://localhost:3000/builder/demo', { timeoutMs: 15000, settleMs: 1000 });

      // Set copilot open/closed state
      await page.eval(`(() => {
        try {
          localStorage.setItem('appforge_copilot_open', '${st.shouldOpen}');
        } catch {}
      })()`);
      await page.goto('http://localhost:3000/builder/demo', { timeoutMs: 15000, settleMs: 1000 });

      // Ensure exact state via toggle button if needed
      await page.eval(`(() => {
        const aside = document.querySelector('aside[aria-label="Copilot AI Panel"]');
        const isOpen = !!aside;
        const targetOpen = ${st.shouldOpen};
        if (isOpen !== targetOpen) {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Copilot'));
          if (btn) btn.click();
        }
      })()`);
      await sleep(400);

      // Dark theme capture
      await page.eval(`
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      `);
      await sleep(300);
      const darkPath = join(outDir, `builder-copilot-${st.name}-${w}-dark.jpg`);
      await page.screenshot({ path: darkPath, format: 'jpeg', quality: 88 });
      console.log(`Saved: ${darkPath}`);

      if (w === 1440 && st.name === 'open') {
        await page.screenshot({ path: join(outDir, `builder-desktop-dark.jpg`), format: 'jpeg', quality: 88 });
      }

      // Light theme capture
      await page.eval(`
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      `);
      await sleep(300);
      const lightPath = join(outDir, `builder-copilot-${st.name}-${w}-light.jpg`);
      await page.screenshot({ path: lightPath, format: 'jpeg', quality: 88 });
      console.log(`Saved: ${lightPath}`);

      if (w === 1440 && st.name === 'open') {
        await page.screenshot({ path: join(outDir, `builder-desktop-light.jpg`), format: 'jpeg', quality: 88 });
      }
    }
  }

  await page.close();
  await browser.close();
  console.log('All builder Copilot screenshots captured successfully.');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});

