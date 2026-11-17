const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function diagnose() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-diag-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9560;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1440,900',
  ]);

  let wsUrl;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  function send(sessionId, method, params = {}) {
    return new Promise((resolve, reject) => {
      const curId = id++;
      const onMsg = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === curId) {
          ws.removeEventListener('message', onMsg);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', onMsg);
      const payload = { id: curId, method, params };
      if (sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
    });
  }

  const { targetId } = await send(null, 'Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send(null, 'Target.attachToTarget', { targetId, flatten: true });
  await send(sessionId, 'Page.enable');
  await send(sessionId, 'Page.navigate', { url: 'http://localhost:3000/?theme=dark' });
  await new Promise(r => setTimeout(r, 2000));

  await send(sessionId, 'Runtime.evaluate', {
    expression: 'document.documentElement.classList.add("dark"); localStorage.setItem("theme", "dark");'
  });
  await new Promise(r => setTimeout(r, 500));

  // Experiment 1: Baseline crop
  async function captureRegion(filename) {
    const { data } = await send(sessionId, 'Page.captureScreenshot', {
      format: 'png',
      clip: { x: 500, y: 280, width: 420, height: 100, scale: 1 }
    });
    fs.writeFileSync(path.join('.screenshots', filename), Buffer.from(data, 'base64'));
    console.log('Saved', filename);
  }

  await captureRegion('diag-1-baseline.png');

  // Experiment 2: remove backdrop-filter on button
  await send(sessionId, 'Runtime.evaluate', {
    expression: `(() => {
      const allBtns = Array.from(document.querySelectorAll('a[href="/templates"]'));
      const btn = allBtns.find(b => b.textContent.includes('View Templates'));
      btn.style.backdropFilter = 'none';
      btn.style.webkitBackdropFilter = 'none';
    })()`
  });
  await captureRegion('diag-2-no-backdrop-filter.png');

  // Experiment 3: restore backdrop filter, remove shadow-xs
  await send(sessionId, 'Runtime.evaluate', {
    expression: `(() => {
      const allBtns = Array.from(document.querySelectorAll('a[href="/templates"]'));
      const btn = allBtns.find(b => b.textContent.includes('View Templates'));
      btn.style.backdropFilter = 'blur(12px)';
      btn.style.boxShadow = 'none';
    })()`
  });
  await captureRegion('diag-3-no-shadow.png');

  // Experiment 4: remove motion.div transform/animation on parent
  await send(sessionId, 'Runtime.evaluate', {
    expression: `(() => {
      const allBtns = Array.from(document.querySelectorAll('a[href="/templates"]'));
      const btn = allBtns.find(b => b.textContent.includes('View Templates'));
      let p = btn.parentElement;
      while (p) {
        p.style.transform = 'none';
        p.style.filter = 'none';
        p.style.willChange = 'auto';
        p = p.parentElement;
      }
    })()`
  });
  await captureRegion('diag-4-no-transforms.png');

  // Experiment 5: hide background ribbons completely
  await send(sessionId, 'Runtime.evaluate', {
    expression: `(() => {
      const bg = document.querySelector('[aria-hidden="true"]');
      if (bg) bg.style.display = 'none';
    })()`
  });
  await captureRegion('diag-5-no-ribbons.png');

  ws.close();
  try { execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' }); } catch {}
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
}

diagnose().catch(console.error);
