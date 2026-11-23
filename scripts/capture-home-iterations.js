const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function captureOne({ url, file, width, height, waitMs = 3000, theme = 'light' }) {
  const tmpDir = path.join(os.tmpdir(), 'chrome-home-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9300 + Math.floor(Math.random() * 500);

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    `--window-size=${width},${height}`,
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
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    throw new Error('Failed to connect to Chrome on port ' + port);
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  function send(sessionId, method, params = {}) {
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
      if (sessionId) {
        ws.send(JSON.stringify({ id, sessionId, method, params }));
      } else {
        ws.send(JSON.stringify({ id, method, params }));
      }
    });
  }

  const { targetId } = await send(null, 'Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send(null, 'Target.attachToTarget', { targetId, flatten: true });

  await send(sessionId, 'Page.enable');
  await send(sessionId, 'Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send(sessionId, 'Page.navigate', { url });
  await sleep(waitMs);

  if (theme === 'dark') {
    await send(sessionId, 'Runtime.evaluate', {
      expression: 'document.documentElement.classList.add("dark"); document.documentElement.style.colorScheme = "dark"; localStorage.setItem("theme", "dark");',
    });
    await sleep(500);
  } else {
    await send(sessionId, 'Runtime.evaluate', {
      expression: 'document.documentElement.classList.remove("dark"); document.documentElement.style.colorScheme = "light"; localStorage.setItem("theme", "light");',
    });
    await sleep(500);
  }

  const { data } = await send(sessionId, 'Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(data, 'base64');
  fs.writeFileSync(file, buffer);
  console.log(`Saved: ${path.basename(file)} (${buffer.length} bytes, ${width}x${height})`);

  ws.close();
  try {
    execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
  } catch {}
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
}

async function main() {
  const round = process.argv[2] || 'round1';
  const outDir = path.resolve('.screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const targets = [
    {
      url: 'http://localhost:3000/?theme=light',
      file: path.join(outDir, `home-${round}-light-1440.png`),
      width: 1440,
      height: 810,
      waitMs: 3500,
      theme: 'light',
    },
    {
      url: 'http://localhost:3000/?theme=dark',
      file: path.join(outDir, `home-${round}-dark-1440.png`),
      width: 1440,
      height: 810,
      waitMs: 3500,
      theme: 'dark',
    },
    {
      url: 'http://localhost:3000/?theme=light',
      file: path.join(outDir, `home-${round}-light-1024.png`),
      width: 1024,
      height: 576,
      waitMs: 3500,
      theme: 'light',
    },
    {
      url: 'http://localhost:3000/?theme=light',
      file: path.join(outDir, `home-${round}-public-1440.png`),
      width: 1440,
      height: 810,
      waitMs: 3500,
      theme: 'light',
    },
  ];

  for (const t of targets) {
    await captureOne(t);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

