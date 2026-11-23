const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-audit-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9289;

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1920,1080',
  ];

  const chromeProc = spawn(chromePath, args);

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
    chromeProc.kill();
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

  const outDir = path.resolve('.screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const targets = [
    // Dashboard 1440
    {
      url: 'http://localhost:3000/dashboard?theme=light',
      file: path.join(outDir, 'dashboard-1440-light.png'),
      width: 1440,
      height: 900,
      waitMs: 2000,
    },
    {
      url: 'http://localhost:3000/dashboard?theme=dark',
      file: path.join(outDir, 'dashboard-1440-dark.png'),
      width: 1440,
      height: 900,
      waitMs: 2000,
    },
    // Dashboard 1920
    {
      url: 'http://localhost:3000/dashboard?theme=light',
      file: path.join(outDir, 'dashboard-1920-light.png'),
      width: 1920,
      height: 1080,
      waitMs: 2000,
    },
    {
      url: 'http://localhost:3000/dashboard?theme=dark',
      file: path.join(outDir, 'dashboard-1920-dark.png'),
      width: 1920,
      height: 1080,
      waitMs: 2000,
    },
    // Builder 1440
    {
      url: 'http://localhost:3000/builder/demo?theme=light',
      file: path.join(outDir, 'builder-1440-light.png'),
      width: 1440,
      height: 900,
      waitMs: 3500,
    },
    {
      url: 'http://localhost:3000/builder/demo?theme=dark',
      file: path.join(outDir, 'builder-1440-dark.png'),
      width: 1440,
      height: 900,
      waitMs: 3500,
    },
    // Builder 1920
    {
      url: 'http://localhost:3000/builder/demo?theme=light',
      file: path.join(outDir, 'builder-1920-light.png'),
      width: 1920,
      height: 1080,
      waitMs: 3500,
    },
    {
      url: 'http://localhost:3000/builder/demo?theme=dark',
      file: path.join(outDir, 'builder-1920-dark.png'),
      width: 1920,
      height: 1080,
      waitMs: 3500,
    },
  ];

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    console.log(`[${i + 1}/${targets.length}] Navigating to ${t.url} (${t.width}x${t.height})...`);
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
      width: t.width,
      height: t.height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await sendSession('Page.navigate', { url: t.url });
    await sleep(t.waitMs);

    const { data } = await sendSession('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(t.file, buffer);
    console.log(`Saved: ${path.basename(t.file)} (${buffer.length} bytes)`);

    await send('Target.closeTarget', { targetId });
  }

  ws.close();
  try {
    execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
  } catch {}
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  console.log('\n=== ALL 8 AUDIT SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Fatal error in capture script:', err);
  process.exit(1);
});
