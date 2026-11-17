const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureFullPage({ url, file, width = 1440, height = 900, waitMs = 3000, theme = 'light' }) {
  const tmpDir = path.join(os.tmpdir(), 'chrome-full-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9500 + Math.floor(Math.random() * 400);

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
    mobile: width < 600,
  });

  await send(sessionId, 'Page.navigate', { url });
  await sleep(waitMs);

  // Hide Next.js dev tools overlay badge
  await send(sessionId, 'Runtime.evaluate', {
    expression: `
      try {
        const style = document.createElement('style');
        style.innerHTML = 'nextjs-portal, [data-nextjs-toast], [data-next-badge], [class*="nextjs-portal"] { display: none !important; }';
        document.head.appendChild(style);
      } catch(e) {}
    `,
  });

  if (theme === 'dark') {
    await send(sessionId, 'Runtime.evaluate', {
      expression: 'document.documentElement.classList.add("dark"); document.documentElement.style.colorScheme = "dark"; localStorage.setItem("theme", "dark");',
    });
    await sleep(400);
  } else {
    await send(sessionId, 'Runtime.evaluate', {
      expression: 'document.documentElement.classList.remove("dark"); document.documentElement.style.colorScheme = "light"; localStorage.setItem("theme", "light");',
    });
    await sleep(400);
  }

  // Scroll down smoothly to trigger any scroll triggers / intersection observers
  await send(sessionId, 'Runtime.evaluate', {
    expression: `
      window.scrollTo(0, document.body.scrollHeight / 2);
    `,
  });
  await sleep(500);
  await send(sessionId, 'Runtime.evaluate', {
    expression: `
      window.scrollTo(0, document.body.scrollHeight);
    `,
  });
  await sleep(500);
  await send(sessionId, 'Runtime.evaluate', {
    expression: `
      window.scrollTo(0, 0);
    `,
  });
  await sleep(400);

  // Capture full scrollable page
  const { data } = await send(sessionId, 'Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  const buffer = Buffer.from(data, 'base64');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
  console.log(`Saved: ${file} (${buffer.length} bytes, ${width}w, ${theme})`);

  ws.close();
  try {
    execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
  } catch {}
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
}

const targets = [
  {
    url: 'http://localhost:3000/?theme=light',
    file: path.resolve('.screenshots/restore-step1-light-1440.png'),
    width: 1440,
    height: 900,
    theme: 'light',
  },
  {
    url: 'http://localhost:3000/?theme=dark',
    file: path.resolve('.screenshots/restore-step1-dark-1440.png'),
    width: 1440,
    height: 900,
    theme: 'dark',
  },
];

async function run() {
  for (const t of targets) {
    console.log(`Capturing ${t.theme} at ${t.width}px...`);
    await captureFullPage(t);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
