import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';

async function test() {
  const browser = await Browser.launch({ width: 1440, height: 900 });
  const page = await browser.newPage({ width: 1440, height: 900 });

  console.log('--- TEST 1: Hard reload on /dashboard ---');
  await page.goto('http://localhost:3000/dashboard', { timeoutMs: 15000, settleMs: 1000 });
  let count = await page.eval(`[document.documentElement, ...document.querySelectorAll('*')].filter(e => getComputedStyle(e).cursor === 'none').length`);
  console.log('Result on /dashboard (hard reload):', count);

  console.log('--- TEST 2: Hard reload on /builder/demo ---');
  await page.goto('http://localhost:3000/builder/demo', { timeoutMs: 15000, settleMs: 1000 });
  count = await page.eval(`[document.documentElement, ...document.querySelectorAll('*')].filter(e => getComputedStyle(e).cursor === 'none').length`);
  console.log('Result on /builder/demo (hard reload):', count);

  console.log('--- TEST 3: Client navigation from / to /dashboard ---');
  await page.goto('http://localhost:3000/', { timeoutMs: 15000, settleMs: 1000 });
  const homeCount = await page.eval(`[document.documentElement, ...document.querySelectorAll('*')].filter(e => getComputedStyle(e).cursor === 'none').length`);
  console.log('On / (home count with cursor:none):', homeCount);

  // Client-side click to /dashboard
  await page.eval(`(() => {
    const link = document.querySelector('a[href="/dashboard"]');
    if (link) link.click();
    else window.location.href = '/dashboard';
  })()`);
  await sleep(1500);
  count = await page.eval(`[document.documentElement, ...document.querySelectorAll('*')].filter(e => getComputedStyle(e).cursor === 'none').length`);
  console.log('Result on /dashboard (client nav):', count);

  if (count > 0) {
    const offending = await page.eval(`[document.documentElement, ...document.querySelectorAll('*')].filter(e => getComputedStyle(e).cursor === 'none').map(e => ({ tag: e.tagName, class: e.className, id: e.id, inline: e.style.cursor }))`);
    console.log('Offending elements on /dashboard:', offending);
  }

  console.log('--- TEST 4: Client navigation from / to /builder/demo ---');
  await page.goto('http://localhost:3000/', { timeoutMs: 15000, settleMs: 1000 });
  await page.eval(`(() => {
    const link = document.querySelector('a[href*="builder"]') || Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Builder'));
    if (link) link.click();
    else window.location.href = '/builder/demo';
  })()`);
  await sleep(1500);
  count = await page.eval(`[document.documentElement, ...document.querySelectorAll('*')].filter(e => getComputedStyle(e).cursor === 'none').length`);
  console.log('Result on /builder/demo (client nav):', count);

  if (count > 0) {
    const offending = await page.eval(`[document.documentElement, ...document.querySelectorAll('*')].filter(e => getComputedStyle(e).cursor === 'none').map(e => ({ tag: e.tagName, class: e.className, id: e.id, inline: e.style.cursor }))`);
    console.log('Offending elements on /builder/demo:', offending);
  }

  await page.close();
  await browser.close();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});

