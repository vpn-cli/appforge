import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('.screenshots', 'theme-ripple');
fs.mkdirSync(outDir, { recursive: true });

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-cdp-ripple-' + Date.now());
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

  async function takeScreenshot(filename) {
    const res = await sendSession('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(outDir, filename), buffer);
    console.log(`Saved screenshot: ${filename}`);
  }

  const pages = [
    { url: 'http://localhost:3001/', name: 'landing' },
    { url: 'http://localhost:3001/templates', name: 'templates' },
    { url: 'http://localhost:3001/builder/demo', name: 'builder' },
  ];

  for (const p of pages) {
    console.log(`Testing theme switch ripple on ${p.name}...`);
    await sendSession('Page.navigate', { url: p.url });
    await sleep(2500);

    // Initial state (dark)
    await takeScreenshot(`${p.name}-1-dark.png`);

    // Click Theme Toggle button
    const clickRes = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[aria-label="Toggle theme"]');
          if (!btn) return 'not_found';
          btn.click();
          return 'clicked';
        })()
      `,
      returnByValue: true,
    });
    console.log(`Click result on ${p.name}:`, clickRes.result.value);

    // Capture mid-transition ripple (~180ms into 450ms animation)
    await sleep(180);
    await takeScreenshot(`${p.name}-2-ripple-to-light.png`);

    // Wait for transition to complete
    await sleep(400);
    await takeScreenshot(`${p.name}-3-light.png`);

    // Click Theme Toggle again (light -> dark)
    await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[aria-label="Toggle theme"]');
          if (btn) btn.click();
        })()
      `,
    });

    // Capture mid-transition ripple back to dark
    await sleep(180);
    await takeScreenshot(`${p.name}-4-ripple-to-dark.png`);

    await sleep(400);
    await takeScreenshot(`${p.name}-5-dark-restored.png`);
  }

  ws.close();
  proc.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  console.log('Theme ripple verification completed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
