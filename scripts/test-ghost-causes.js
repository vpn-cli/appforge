const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testCauses() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-test-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9570;
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
  await new Promise(r => setTimeout(r, 2500));

  await send(sessionId, 'Runtime.evaluate', {
    expression: 'document.documentElement.classList.add("dark"); localStorage.setItem("theme", "dark");'
  });
  await new Promise(r => setTimeout(r, 500));

  async function capture(name) {
    const { data } = await send(sessionId, 'Page.captureScreenshot', {
      format: 'png',
      clip: { x: 500, y: 280, width: 420, height: 100, scale: 1 }
    });
    fs.writeFileSync(path.join('.screenshots', name), Buffer.from(data, 'base64'));
    console.log('Saved', name);
  }

  // 1. Initial
  await capture('cause-1-initial.png');

  // 2. What if we remove only the ribbon background (hide BackgroundRibbons)?
  await send(sessionId, 'Runtime.evaluate', {
    expression: `document.querySelector('[aria-hidden="true"]').style.display = 'none';`
  });
  await capture('cause-2-no-ribbon.png');

  // Restore ribbon
  await send(sessionId, 'Runtime.evaluate', {
    expression: `document.querySelector('[aria-hidden="true"]').style.display = '';`
  });

  // 3. What if we remove only backdropFilter on View Templates?
  await send(sessionId, 'Runtime.evaluate', {
    expression: `
      const b = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('View Templates'));
      b.style.backdropFilter = 'none';
      b.style.webkitBackdropFilter = 'none';
    `
  });
  await capture('cause-3-no-blur.png');

  // Restore blur, but add overflow:hidden and isolate to button
  await send(sessionId, 'Runtime.evaluate', {
    expression: `
      const b = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('View Templates'));
      b.style.backdropFilter = 'blur(12px)';
      b.style.overflow = 'hidden';
      b.style.isolation = 'isolate';
    `
  });
  await capture('cause-4-overflow-hidden.png');

  // 5. What if motion.div has no transform?
  await send(sessionId, 'Runtime.evaluate', {
    expression: `
      const b = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('View Templates'));
      b.parentElement.style.transform = 'none';
    `
  });
  await capture('cause-5-no-parent-transform.png');

  // 6. Inspect exact pixel colors around the button
  const analysis = await send(sessionId, 'Runtime.evaluate', {
    expression: `(() => {
      const b = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('View Templates'));
      const rect = b.getBoundingClientRect();
      const parentRect = b.parentElement.getBoundingClientRect();
      const ribbon = document.querySelector('[aria-hidden="true"]');
      const ribbonChildren = Array.from(ribbon.children).map(c => ({
        tag: c.tagName,
        class: c.className,
        rect: c.getBoundingClientRect()
      }));
      return {
        btnRect: rect,
        parentRect,
        ribbonChildren,
        parentTransform: window.getComputedStyle(b.parentElement).transform,
        btnTransform: window.getComputedStyle(b).transform,
        btnFilter: window.getComputedStyle(b).filter,
        btnBackdrop: window.getComputedStyle(b).backdropFilter
      };
    })()`,
    returnByValue: true
  });
  console.log('Analysis:', JSON.stringify(analysis.result.value, null, 2));

  ws.close();
  try { execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' }); } catch {}
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
}

testCauses().catch(console.error);
