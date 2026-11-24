import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const localScreenshotsDir = path.resolve('.screenshots/builder-resize');
const artifactScreenshotsDir = 'C:\\Users\\vipin\\.gemini\\antigravity\\brain\\3b6a0de6-f841-4ddf-b0a3-89571bdd6681\\builder-resize';

fs.mkdirSync(localScreenshotsDir, { recursive: true });
fs.mkdirSync(artifactScreenshotsDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-resize-audit-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9340 + Math.floor(Math.random() * 300);

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1440,900',
  ];

  const proc = spawn(chromePath, args);

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
  await sendSession('Runtime.enable');
  await sendSession('DOM.enable');

  console.log('Navigating to builder demo...');
  await sendSession('Page.navigate', { url: 'http://localhost:3001/builder/demo' });
  await sleep(2500);

  // Set dark theme
  await sendSession('Runtime.evaluate', {
    expression: `
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    `,
  });
  await sleep(500);

  // 1. Audit Handle in DOM
  const handleCheck = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const handle = document.querySelector('[role="separator"]');
        if (!handle) return { error: 'No separator found' };
        const rect = handle.getBoundingClientRect();
        return {
          id: handle.getAttribute('id'),
          role: handle.getAttribute('role'),
          ariaOrientation: handle.getAttribute('aria-orientation'),
          ariaValuenow: handle.getAttribute('aria-valuenow'),
          ariaValuemin: handle.getAttribute('aria-valuemin'),
          ariaValuemax: handle.getAttribute('aria-valuemax'),
          tabIndex: handle.tabIndex,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        };
      })()
    `,
    returnByValue: true,
  });

  console.log('Handle Attributes:', handleCheck.result.value);

  // 2. Capture Handle Screenshot (Idle state)
  const rect = handleCheck.result.value.rect;
  let shot = await sendSession('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: Math.max(0, rect.x - 40),
      y: Math.max(0, rect.y + 200),
      width: 80,
      height: 200,
      scale: 2,
    },
  });

  fs.writeFileSync(path.join(localScreenshotsDir, 'handle-idle.png'), Buffer.from(shot.data, 'base64'));
  fs.writeFileSync(path.join(artifactScreenshotsDir, 'handle-idle.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved handle-idle.png');

  // 3. Test Hover & Focus
  await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const handle = document.querySelector('[role="separator"]');
        handle.focus();
        handle.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      })()
    `,
  });
  await sleep(300);

  shot = await sendSession('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: Math.max(0, rect.x - 40),
      y: Math.max(0, rect.y + 200),
      width: 80,
      height: 200,
      scale: 2,
    },
  });
  fs.writeFileSync(path.join(localScreenshotsDir, 'handle-hover.png'), Buffer.from(shot.data, 'base64'));
  fs.writeFileSync(path.join(artifactScreenshotsDir, 'handle-hover.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved handle-hover.png');

  // 4. Test Keyboard Resize (Arrow keys)
  const kbResult = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const handle = document.querySelector('[role="separator"]');
        const beforeVal = handle.getAttribute('aria-valuenow');
        // Dispatch ArrowLeft
        handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        const afterVal = handle.getAttribute('aria-valuenow');
        return { beforeVal, afterVal };
      })()
    `,
    returnByValue: true,
  });
  console.log('Keyboard Resize Result:', kbResult.result.value);

  // 5. Test Double Click Reset
  const dblClickResult = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const handle = document.querySelector('[role="separator"]');
        handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        const resetVal = handle.getAttribute('aria-valuenow');
        const savedStorage = localStorage.getItem('appforge_builder_panel_sizes');
        return { resetVal, savedStorage };
      })()
    `,
    returnByValue: true,
  });
  console.log('Double Click Reset Result:', dblClickResult.result.value);

  // 6. Test Real Dragging with Chrome Input.dispatchMouseEvent
  console.log('Testing real mouse drag with CDP...');
  await sendSession('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: Math.round(rect.x + 4),
    y: Math.round(rect.y + 100),
  });
  await sleep(100);

  await sendSession('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    button: 'left',
    buttons: 1,
    clickCount: 1,
    x: Math.round(rect.x + 4),
    y: Math.round(rect.y + 100),
  });
  await sleep(100);

  // Move right by 80px while dragging
  await sendSession('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    buttons: 1,
    x: Math.round(rect.x + 84),
    y: Math.round(rect.y + 100),
  });
  await sleep(200);

  const duringDrag = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const handle = document.querySelector('[role="separator"]');
        const overlay = document.querySelector('.fixed.inset-0.z-50.cursor-col-resize');
        return {
          bodyCursor: document.body.style.cursor,
          bodyUserSelect: document.body.style.userSelect,
          hasOverlay: Boolean(overlay),
          ariaValuenow: handle ? handle.getAttribute('aria-valuenow') : null
        };
      })()
    `,
    returnByValue: true,
  });
  console.log('During Drag State:', duringDrag.result.value);

  // Capture dragging screenshot
  const dragShot = await sendSession('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: Math.max(0, rect.x - 20),
      y: Math.max(0, rect.y + 200),
      width: 120,
      height: 200,
      scale: 2,
    },
  });
  fs.writeFileSync(path.join(localScreenshotsDir, 'handle-drag.png'), Buffer.from(dragShot.data, 'base64'));
  fs.writeFileSync(path.join(artifactScreenshotsDir, 'handle-drag.png'), Buffer.from(dragShot.data, 'base64'));
  console.log('Saved handle-drag.png');

  // Release mouse
  await sendSession('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    button: 'left',
    x: Math.round(rect.x + 84),
    y: Math.round(rect.y + 100),
  });
  await sleep(200);

  const afterDrag = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const handle = document.querySelector('[role="separator"]');
        const overlay = document.querySelector('.fixed.inset-0.z-50.cursor-col-resize');
        return {
          bodyCursor: document.body.style.cursor,
          bodyUserSelect: document.body.style.userSelect,
          hasOverlay: Boolean(overlay),
          ariaValuenow: handle ? handle.getAttribute('aria-valuenow') : null,
          savedStorage: localStorage.getItem('appforge_builder_panel_sizes')
        };
      })()
    `,
    returnByValue: true,
  });
  console.log('After Drag State:', afterDrag.result.value);

  // 7. Full Builder Split Pane View Screenshot (Light & Dark)
  for (const theme of ['light', 'dark']) {
    await sendSession('Runtime.evaluate', {
      expression: `
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add('${theme}');
        document.documentElement.style.colorScheme = '${theme}';
      `,
    });
    await sleep(400);

    const fullShot = await sendSession('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1440,
        height: 900,
        scale: 1,
      },
    });

    const fileName = `builder-split-pane-${theme}.png`;
    fs.writeFileSync(path.join(localScreenshotsDir, fileName), Buffer.from(fullShot.data, 'base64'));
    fs.writeFileSync(path.join(artifactScreenshotsDir, fileName), Buffer.from(fullShot.data, 'base64'));
    console.log(`Saved ${fileName}`);
  }

  ws.close();
  proc.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  console.log('\nBuilder resize audit complete!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
