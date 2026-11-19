const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.join(__dirname, '..', '.screenshots');
const artifactDir = 'C:\\Users\\vipin\\.gemini\\antigravity\\brain\\a356b807-afbf-42db-adee-37ec29f90ae5';
fs.mkdirSync(outDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runSession(actions, width = 1440, height = 900, mobile = false) {
  const tmpDir = path.join(os.tmpdir(), 'chrome-audit-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9600 + Math.floor(Math.random() * 300);

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
    await sleep(150);
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

  try {
    const { targetId } = await send(null, 'Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send(null, 'Target.attachToTarget', { targetId, flatten: true });

    await send(sessionId, 'Page.enable');
    await send(sessionId, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });

    await actions({ send, sessionId });
  } finally {
    ws.close();
    chromeProc.kill();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

async function captureScreenshot({ send, sessionId, filename }) {
  // Hide dev overlay badges
  await send(sessionId, 'Runtime.evaluate', {
    expression: `
      try {
        const style = document.createElement('style');
        style.innerHTML = 'nextjs-portal, [data-nextjs-toast], [data-next-badge], [class*="nextjs-portal"] { display: none !important; }';
        document.head.appendChild(style);
      } catch(e) {}
    `,
  });

  await sleep(400);
  const { data } = await send(sessionId, 'Page.captureScreenshot', { format: 'png' });
  const filepath = path.join(outDir, filename);
  fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
  console.log(`Saved screenshot: ${filepath}`);

  const artifactFile = path.join(artifactDir, filename);
  fs.writeFileSync(artifactFile, Buffer.from(data, 'base64'));
  console.log(`Saved artifact: ${artifactFile}`);
}

async function main() {
  console.log('Capturing Landing 1440x900 (Light)...');
  await runSession(async ({ send, sessionId }) => {
    await send(sessionId, 'Page.navigate', { url: 'http://localhost:3000/?theme=light' });
    await sleep(2500);
    await captureScreenshot({ send, sessionId, filename: 'landing-1440-light.png' });
  }, 1440, 900, false);

  console.log('Capturing Landing 1440x900 (Dark)...');
  await runSession(async ({ send, sessionId }) => {
    await send(sessionId, 'Page.navigate', { url: 'http://localhost:3000/?theme=dark' });
    await sleep(2500);
    await captureScreenshot({ send, sessionId, filename: 'landing-1440-dark.png' });
  }, 1440, 900, false);

  console.log('Capturing Landing 390x844 (Light)...');
  await runSession(async ({ send, sessionId }) => {
    await send(sessionId, 'Page.navigate', { url: 'http://localhost:3000/?theme=light' });
    await sleep(2500);
    await captureScreenshot({ send, sessionId, filename: 'landing-390-light.png' });
  }, 390, 844, true);

  console.log('Capturing Landing 390x844 (Dark)...');
  await runSession(async ({ send, sessionId }) => {
    await send(sessionId, 'Page.navigate', { url: 'http://localhost:3000/?theme=dark' });
    await sleep(2500);
    await captureScreenshot({ send, sessionId, filename: 'landing-390-dark.png' });
  }, 390, 844, true);

  console.log('All landing pre-flight screenshots captured successfully.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
