const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function inspect() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-inspect-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9550;
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
  await new Promise(r => setTimeout(r, 3000));

  await send(sessionId, 'Runtime.evaluate', {
    expression: 'document.documentElement.classList.add("dark"); localStorage.setItem("theme", "dark");'
  });
  await new Promise(r => setTimeout(r, 500));

  const result = await send(sessionId, 'Runtime.evaluate', {
    expression: `(() => {
      const allBtns = Array.from(document.querySelectorAll('a[href="/templates"]'));
      const btn = allBtns.find(b => b.textContent.includes('View Templates'));
      if (!btn) return { error: 'btn not found' };
      const rect = btn.getBoundingClientRect();
      const cs = window.getComputedStyle(btn);
      const beforeCs = window.getComputedStyle(btn, '::before');
      const afterCs = window.getComputedStyle(btn, '::after');
      
      let cur = btn;
      const ancestors = [];
      while (cur) {
        const c = window.getComputedStyle(cur);
        ancestors.push({
          tag: cur.tagName,
          className: cur.className,
          rect: { left: cur.getBoundingClientRect().left, top: cur.getBoundingClientRect().top, width: cur.getBoundingClientRect().width, height: cur.getBoundingClientRect().height },
          backdropFilter: c.backdropFilter,
          filter: c.filter,
          boxShadow: c.boxShadow,
          backgroundColor: c.backgroundColor,
          transform: c.transform,
          overflow: c.overflow,
          contain: c.contain,
          opacity: c.opacity,
          zIndex: c.zIndex
        });
        cur = cur.parentElement;
      }

      // Check SVG or background elements
      const ribbons = document.querySelector('svg');
      const ribbonContainer = ribbons ? ribbons.closest('div') : null;

      return {
        btnRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        btnStyles: {
          backdropFilter: cs.backdropFilter,
          boxShadow: cs.boxShadow,
          border: cs.border,
          outline: cs.outline,
          backgroundColor: cs.backgroundColor,
          borderRadius: cs.borderRadius
        },
        before: {
          content: beforeCs.content,
          backdropFilter: beforeCs.backdropFilter,
          boxShadow: beforeCs.boxShadow,
          bg: beforeCs.backgroundColor
        },
        after: {
          content: afterCs.content,
          backdropFilter: afterCs.backdropFilter,
          boxShadow: afterCs.boxShadow,
          bg: afterCs.backgroundColor
        },
        ancestors
      };
    })()`,
    returnByValue: true
  });

  console.log(JSON.stringify(result.result.value, null, 2));

  ws.close();
  try { execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' }); } catch {}
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
}

inspect().catch(console.error);
