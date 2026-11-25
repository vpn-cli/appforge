import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const localScreenshotsDir = path.resolve('.screenshots/logos');
const artifactScreenshotsDir = 'C:\\Users\\vipin\\.gemini\\antigravity\\brain\\3b6a0de6-f841-4ddf-b0a3-89571bdd6681\\logos';

fs.mkdirSync(localScreenshotsDir, { recursive: true });
fs.mkdirSync(artifactScreenshotsDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-logo-audit-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9320 + Math.floor(Math.random() * 300);

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
  await sendSession('DOM.enable');

  const targets = [
    {
      name: 'landing-nav',
      url: 'http://localhost:3001/',
      selector: 'header a[href="/"]',
      clipPadding: 16,
    },
    {
      name: 'app-nav',
      url: 'http://localhost:3001/apps',
      selector: 'header a[aria-label="AppForge Home"]',
      clipPadding: 16,
    },
    {
      name: 'builder-header',
      url: 'http://localhost:3001/builder/demo',
      selector: 'header a[aria-label="AppForge Home"]',
      clipPadding: 16,
    },
    {
      name: 'footer',
      url: 'http://localhost:3001/',
      selector: 'footer .flex.items-center.gap-3',
      clipPadding: 16,
      scrollToBottom: true,
    },
    {
      name: 'sign-in',
      url: 'http://localhost:3001/sign-in',
      selector: 'header a[href="/"]',
      clipPadding: 16,
    },
  ];

  const results = [];

  for (const t of targets) {
    console.log(`\nAuditing ${t.name} at ${t.url}...`);
    await sendSession('Page.navigate', { url: t.url });
    await sleep(2000);

    if (t.scrollToBottom) {
      await sendSession('Runtime.evaluate', {
        expression: `window.scrollTo(0, document.body.scrollHeight);`,
      });
      await sleep(500);
    }

    for (const theme of ['light', 'dark']) {
      // Toggle theme class
      await sendSession('Runtime.evaluate', {
        expression: `
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add('${theme}');
          document.documentElement.style.colorScheme = '${theme}';
          localStorage.setItem('theme', '${theme}');
        `,
      });
      await sleep(400);

      // Query bounding box and colors
      const evalRes = await sendSession('Runtime.evaluate', {
        expression: `
          (() => {
            const el = document.querySelector('${t.selector}');
            if (!el) return { error: 'Element not found for selector ${t.selector}' };
            const rect = el.getBoundingClientRect();
            const tile = el.querySelector('div') || el;
            const computedTile = window.getComputedStyle(tile);
            const computedMark = el.querySelector('svg') ? window.getComputedStyle(el.querySelector('svg')) : null;
            return {
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              tileBg: computedTile.backgroundColor,
              tileColor: computedTile.color,
              markColor: computedMark ? computedMark.color : 'N/A'
            };
          })()
        `,
        returnByValue: true,
      });

      const info = evalRes.result.value;
      if (info.error) {
        console.error(`  [${theme}] Error:`, info.error);
        continue;
      }

      console.log(`  [${theme}] tileBg: ${info.tileBg}, tileColor: ${info.tileColor}, markColor: ${info.markColor}`);

      const pad = t.clipPadding || 10;
      const clipX = Math.max(0, Math.floor(info.rect.x - pad));
      const clipY = Math.max(0, Math.floor(info.rect.y - pad));
      const clipW = Math.ceil(info.rect.width + pad * 2);
      const clipH = Math.ceil(info.rect.height + pad * 2);

      const shot = await sendSession('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: clipX,
          y: clipY,
          width: clipW,
          height: clipH,
          scale: 2,
        },
      });

      const fileName = `${t.name}-${theme}.png`;
      const localPath = path.join(localScreenshotsDir, fileName);
      const artifactPath = path.join(artifactScreenshotsDir, fileName);
      const buf = Buffer.from(shot.data, 'base64');
      fs.writeFileSync(localPath, buf);
      fs.writeFileSync(artifactPath, buf);
      console.log(`  Saved screenshot: ${fileName}`);

      results.push({
        location: t.name,
        theme,
        tileBg: info.tileBg,
        tileColor: info.tileColor,
        markColor: info.markColor,
        fileName,
      });
    }
  }

  // Favicon screenshot
  console.log('\nCapturing favicon in light and dark...');
  await sendSession('Page.navigate', { url: 'http://localhost:3001/icon.svg' });
  await sleep(1000);

  for (const theme of ['light', 'dark']) {
    await sendSession('Emulation.setEmulatedMedia', {
      media: 'page',
      features: [{ name: 'prefers-color-scheme', value: theme }],
    });
    await sleep(400);

    const shot = await sendSession('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 300,
        height: 300,
        scale: 2,
      },
    });

    const fileName = `favicon-${theme}.png`;
    const localPath = path.join(localScreenshotsDir, fileName);
    const artifactPath = path.join(artifactScreenshotsDir, fileName);
    const buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(localPath, buf);
    fs.writeFileSync(artifactPath, buf);
    console.log(`  Saved favicon screenshot: ${fileName}`);
    results.push({
      location: 'favicon',
      theme,
      tileBg: theme === 'dark' ? '#FFFFFF' : '#17171F',
      tileColor: theme === 'dark' ? '#0C0C0E' : '#FFFFFF',
      markColor: theme === 'dark' ? '#0C0C0E' : '#FFFFFF',
      fileName,
    });
  }

  ws.close();
  proc.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  console.log('\nAudit complete! Total captures:', results.length);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
