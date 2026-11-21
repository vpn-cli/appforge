const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-single-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9222;

  // Clean up any stale chrome at 9222
  try {
    execSync('taskkill /IM chrome.exe /FI "WINDOWTITLE eq about:blank*" /F', { stdio: 'ignore' });
  } catch {}

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

  const screenshots = [
    // 1. Builder Refined: 1440px wide, Copilot Open & Closed, Light & Dark
    {
      url: 'http://localhost:3000/builder/demo?copilot=open&theme=dark',
      file: path.resolve('.screenshots/builder-copilot-open-1440-dark.png'),
      width: 1440,
      height: 900,
    },
    {
      url: 'http://localhost:3000/builder/demo?copilot=open&theme=light',
      file: path.resolve('.screenshots/builder-copilot-open-1440-light.png'),
      width: 1440,
      height: 900,
    },
    {
      url: 'http://localhost:3000/builder/demo?copilot=closed&theme=dark',
      file: path.resolve('.screenshots/builder-copilot-closed-1440-dark.png'),
      width: 1440,
      height: 900,
    },
    {
      url: 'http://localhost:3000/builder/demo?copilot=closed&theme=light',
      file: path.resolve('.screenshots/builder-copilot-closed-1440-light.png'),
      width: 1440,
      height: 900,
    },

    // 2. Builder Refined: 1280px wide, Copilot Open & Closed, Light & Dark
    {
      url: 'http://localhost:3000/builder/demo?copilot=open&theme=dark',
      file: path.resolve('.screenshots/builder-copilot-open-1280-dark.png'),
      width: 1280,
      height: 800,
    },
    {
      url: 'http://localhost:3000/builder/demo?copilot=open&theme=light',
      file: path.resolve('.screenshots/builder-copilot-open-1280-light.png'),
      width: 1280,
      height: 800,
    },
    {
      url: 'http://localhost:3000/builder/demo?copilot=closed&theme=dark',
      file: path.resolve('.screenshots/builder-copilot-closed-1280-dark.png'),
      width: 1280,
      height: 800,
    },
    {
      url: 'http://localhost:3000/builder/demo?copilot=closed&theme=light',
      file: path.resolve('.screenshots/builder-copilot-closed-1280-light.png'),
      width: 1280,
      height: 800,
    },

    // 3. Dev Stress Test Page: 375, 768, 1280px in both themes
    {
      url: 'http://localhost:3000/dev/renderers?theme=dark',
      file: path.resolve('.screenshots/renderers-stress-375-dark.png'),
      width: 375,
      height: 812,
    },
    {
      url: 'http://localhost:3000/dev/renderers?theme=light',
      file: path.resolve('.screenshots/renderers-stress-375-light.png'),
      width: 375,
      height: 812,
    },
    {
      url: 'http://localhost:3000/dev/renderers?theme=dark',
      file: path.resolve('.screenshots/renderers-stress-768-dark.png'),
      width: 768,
      height: 1024,
    },
    {
      url: 'http://localhost:3000/dev/renderers?theme=light',
      file: path.resolve('.screenshots/renderers-stress-768-light.png'),
      width: 768,
      height: 1024,
    },
    {
      url: 'http://localhost:3000/dev/renderers?theme=dark',
      file: path.resolve('.screenshots/renderers-stress-1280-dark.png'),
      width: 1280,
      height: 900,
    },
    {
      url: 'http://localhost:3000/dev/renderers?theme=light',
      file: path.resolve('.screenshots/renderers-stress-1280-light.png'),
      width: 1280,
      height: 900,
    },
  ];

  for (const s of screenshots) {
    console.log(`Capturing: ${s.file} (${s.width}x${s.height})`);
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
      width: s.width,
      height: s.height,
      deviceScaleFactor: 2,
      mobile: s.width < 600,
    });

    await sendSession('Page.navigate', { url: s.url });

    // Wait for page load, theme application and Monaco fonts
    await sleep(2200);

    const { data } = await sendSession('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(s.file, buffer);
    console.log(`Saved: ${path.basename(s.file)} (${buffer.length} bytes)`);

    await send('Target.closeTarget', { targetId });
  }

  ws.close();
  try {
    execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
  } catch {}
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  console.log('ALL AUDIT SCREENSHOTS COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Error in capture suite:', err);
  process.exit(1);
});
