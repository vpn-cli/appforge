const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureRoutes() {
  const outDir = path.resolve('.screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const routes = [
    { name: 'landing', path: '/' },
    { name: 'dashboard', path: '/dashboard' },
    { name: 'builder', path: '/builder/demo' },
    { name: 'templates', path: '/templates' },
    { name: 'apps-id', path: '/apps/demo' },
    { name: 'sign-in', path: '/sign-in' },
    { name: 'sign-up', path: '/sign-up' },
    { name: '404', path: '/not-found' },
  ];

  console.log('Warming up all routes to ensure Next.js has compiled them...');
  for (const route of routes) {
    try {
      await fetch(`http://localhost:3000${route.path}?theme=light`);
    } catch {}
  }
  console.log('Warmup complete.');

  const targets = [];
  for (const route of routes) {
    targets.push({
      name: `${route.name}-light`,
      url: `http://localhost:3000${route.path}?theme=light`,
      theme: 'light',
      file: path.join(outDir, `${route.name}-light.png`),
    });
    targets.push({
      name: `${route.name}-dark`,
      url: `http://localhost:3000${route.path}?theme=dark`,
      theme: 'dark',
      file: path.join(outDir, `${route.name}-dark.png`),
    });
  }

  const tmpDir = path.join(os.tmpdir(), 'chrome-capture-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9240 + Math.floor(Math.random() * 40);

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1440,900',
  ];

  const chromeProc = spawn(chromePath, args);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
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
    throw new Error('Failed to connect to Chrome CDP on port ' + port);
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

  console.log(`Starting capture of ${targets.length} screenshots (1440px)...`);

  for (const t of targets) {
    console.log(`[Capturing] ${t.name}: ${t.url}`);
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
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
      mobile: false,
    });

    await sendSession('Page.navigate', { url: t.url });

    // Wait for page to finish rendering
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      try {
        const res = await sendSession('Runtime.evaluate', {
          expression: "Boolean(document.body && document.readyState === 'complete')",
          returnByValue: true,
        });
        if (res && res.result && res.result.value) {
          break;
        }
      } catch {}
    }
    await sleep(2000);

    // Explicitly enforce theme class in DOM
    const themeJs =
      t.theme === 'dark'
        ? "document.documentElement.classList.add('dark'); document.documentElement.style.colorScheme='dark';"
        : "document.documentElement.classList.remove('dark'); document.documentElement.style.colorScheme='light';";
    await sendSession('Runtime.evaluate', { expression: themeJs });
    await sleep(600);

    const { data } = await sendSession('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(t.file, buffer);
    console.log(`  ✓ Saved: ${path.basename(t.file)} (${buffer.length} bytes)`);

    await send('Target.closeTarget', { targetId });
  }

  ws.close();
  try {
    execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
  } catch {}
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  console.log('\nAll 16 screenshots successfully captured in .screenshots/\n');
}

captureRoutes().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
