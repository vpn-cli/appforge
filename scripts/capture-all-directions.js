const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function captureUrl(url, outFile, width = 1440, height = 900) {
  const tmpDir = path.join(os.tmpdir(), 'chrome-cdp-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9222 + Math.floor(Math.random() * 500);

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    `--window-size=${width},${height}`,
  ];

  const proc = spawn(chromePath, args);

  // Wait for CDP port to be ready
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

  // Create new target / page
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
  await sendSession('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2, // Retina resolution 2x
    mobile: false,
  });

  await sendSession('Page.navigate', { url });

  // Poll until Monaco editor and fonts are ready (up to 8 seconds)
  const startTime = Date.now();
  while (Date.now() - startTime < 8000) {
    await sleep(300);
    try {
      const res = await sendSession('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('.view-line') && document.fonts.status === 'loaded')`,
        returnByValue: true,
      });
      if (res?.result?.value) {
        break;
      }
    } catch {}
  }

  // Extra pause for CSS transitions / theme settling
  await sleep(600);

  const { data } = await sendSession('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(data, 'base64');
  fs.writeFileSync(outFile, buffer);
  console.log(`Saved screenshot: ${outFile} (${buffer.length} bytes)`);

  ws.close();
  proc.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
}

async function main() {
  const screenshots = [
    {
      url: 'http://localhost:3000/builder/demo?direction=A&theme=dark',
      file: path.resolve('.screenshots/direction-a-dark.png'),
    },
    {
      url: 'http://localhost:3000/builder/demo?direction=A&theme=light',
      file: path.resolve('.screenshots/direction-a-light.png'),
    },
    {
      url: 'http://localhost:3000/builder/demo?direction=B&theme=dark',
      file: path.resolve('.screenshots/direction-b-dark.png'),
    },
    {
      url: 'http://localhost:3000/builder/demo?direction=B&theme=light',
      file: path.resolve('.screenshots/direction-b-light.png'),
    },
  ];

  for (const s of screenshots) {
    console.log(`Capturing ${s.url} -> ${s.file}`);
    await captureUrl(s.url, s.file);
  }
  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
