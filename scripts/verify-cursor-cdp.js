const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runCheck() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-cdp-cursor-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9222 + Math.floor(Math.random() * 500);

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1440,900',
  ];

  const proc = spawn(chromePath, args);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(200);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    proc.kill();
    throw new Error('Failed to connect to Chrome CDP');
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      const onMsg = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', onMsg);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  function sendSession(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      const onMsg = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', onMsg);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  }

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');

  const cursorCheckCode = `
    [document.documentElement, ...document.querySelectorAll('*')].filter(e => getComputedStyle(e).cursor === 'none').length
  `;

  async function evaluateCursorCheck() {
    const res = await sendSession('Runtime.evaluate', {
      expression: cursorCheckCode,
      returnByValue: true,
    });
    return res?.result?.value;
  }

  console.log('--- CURSOR VERIFICATION CHECKS ---');

  // Test 1: Hard reload /dashboard
  await sendSession('Page.navigate', { url: 'http://localhost:3000/dashboard' });
  await sleep(1500);
  const count1 = await evaluateCursorCheck();
  console.log('1. Hard reload on /dashboard:', count1);

  // Test 2: Hard reload /builder/demo
  await sendSession('Page.navigate', { url: 'http://localhost:3000/builder/demo' });
  await sleep(1500);
  const count2 = await evaluateCursorCheck();
  console.log('2. Hard reload on /builder/demo:', count2);

  // Test 3: Client-side navigation from / to /dashboard
  await sendSession('Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(1500);
  // Click the link to dashboard
  await sendSession('Runtime.evaluate', {
    expression: `
      const link = document.querySelector('a[href="/dashboard"]');
      if (link) link.click();
      else window.location.href = '/dashboard';
    `,
  });
  await sleep(1500);
  const count3 = await evaluateCursorCheck();
  console.log('3. Client-side navigation from / to /dashboard:', count3);

  // Test 4: Client-side navigation from / to /builder/demo
  await sendSession('Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(1500);
  await sendSession('Runtime.evaluate', {
    expression: `
      const link = document.querySelector('a[href*="/builder"]') || document.querySelector('a[href="/dashboard"]');
      if (link) {
        link.click();
      } else {
        // Next.js client router push
        window.location.href = '/builder/demo';
      }
    `,
  });
  // If navigated to dashboard, click an app card to builder
  await sleep(1500);
  await sendSession('Runtime.evaluate', {
    expression: `
      const builderLink = document.querySelector('a[href*="/builder/"]');
      if (builderLink) builderLink.click();
      else if (!window.location.pathname.includes('/builder/')) window.location.href = '/builder/demo';
    `,
  });
  await sleep(2000);
  const count4 = await evaluateCursorCheck();
  console.log('4. Client-side navigation from / to /builder/demo:', count4);

  ws.close();
  proc.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  console.log('\n--- VERIFICATION RESULT ---');
  const allZero = count1 === 0 && count2 === 0 && count3 === 0 && count4 === 0;
  console.log('All results zero?', allZero ? 'PASSED ✅' : 'FAILED ❌');
  return { count1, count2, count3, count4, allZero };
}

runCheck().catch(err => {
  console.error('Error running cursor check:', err);
  process.exit(1);
});
