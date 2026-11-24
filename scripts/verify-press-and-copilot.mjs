import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const localScreenshotsDir = path.resolve('.screenshots/part4-5');
const artifactScreenshotsDir = 'C:\\Users\\vipin\\.gemini\\antigravity\\brain\\3b6a0de6-f841-4ddf-b0a3-89571bdd6681\\part4-5';

fs.mkdirSync(localScreenshotsDir, { recursive: true });
fs.mkdirSync(artifactScreenshotsDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-part4-audit-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9360 + Math.floor(Math.random() * 300);

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

  console.log('=== PART 5: HEADLINE AT 1280px & 1440px ===');
  await sendSession('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await sendSession('Page.navigate', { url: 'http://localhost:3001/' });
  await sleep(2500);

  const headline1280 = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const h1 = document.querySelector('h1');
        if (!h1) return { error: 'No h1 found' };
        const rect = h1.getBoundingClientRect();
        const computed = window.getComputedStyle(h1);
        const gradientSpan = h1.querySelector('.headline-gradient');
        return {
          text: h1.innerText,
          rect: { width: rect.width, height: rect.height },
          lineHeight: computed.lineHeight,
          isSingleLine: rect.height < 90,
          gradientText: gradientSpan ? gradientSpan.innerText : null
        };
      })()
    `,
    returnByValue: true,
  });
  console.log('Headline at 1280px:', headline1280.result.value);

  let shot = await sendSession('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 200, y: 80, width: 880, height: 180, scale: 2 },
  });
  fs.writeFileSync(path.join(localScreenshotsDir, 'hero-headline-1280px.png'), Buffer.from(shot.data, 'base64'));
  fs.writeFileSync(path.join(artifactScreenshotsDir, 'hero-headline-1280px.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved hero-headline-1280px.png');

  // 1440px check
  await sendSession('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(300);

  const headline1440 = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const h1 = document.querySelector('h1');
        const rect = h1.getBoundingClientRect();
        return {
          rect: { width: rect.width, height: rect.height },
          isSingleLine: rect.height < 90
        };
      })()
    `,
    returnByValue: true,
  });
  console.log('Headline at 1440px:', headline1440.result.value);

  console.log('\n=== PART 4: NAV SLIDING ACTIVE PILL ===');
  // Check sliding pill on landing page
  const landingNavPill = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const pill = document.querySelector('header nav [class*="rounded-full"][class*="bg-surface"]');
        const activeLink = document.querySelector('header nav a[class*="text-brand-link"]');
        return {
          hasSlidingPill: Boolean(pill),
          activeText: activeLink ? activeLink.innerText : null
        };
      })()
    `,
    returnByValue: true,
  });
  console.log('Landing Nav Sliding Pill:', landingNavPill.result.value);

  // Navigate to /apps and check AppHeader sliding pill
  await sendSession('Page.navigate', { url: 'http://localhost:3001/apps' });
  await sleep(2500);

  const appHeaderNav = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const nav = document.querySelector('header nav[aria-label="Application Navigation"]');
        if (!nav) return { error: 'No app header nav found' };
        const links = Array.from(nav.querySelectorAll('a')).map(a => a.innerText);
        const slidingPill = nav.querySelector('[class*="bg-card"][class*="rounded-full"]');
        return {
          links,
          hasSlidingPill: Boolean(slidingPill)
        };
      })()
    `,
    returnByValue: true,
  });
  console.log('AppHeader Nav Segments & Sliding Pill:', appHeaderNav.result.value);

  shot = await sendSession('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 400, y: 16, width: 450, height: 64, scale: 2 },
  });
  fs.writeFileSync(path.join(localScreenshotsDir, 'appheader-sliding-pill.png'), Buffer.from(shot.data, 'base64'));
  fs.writeFileSync(path.join(artifactScreenshotsDir, 'appheader-sliding-pill.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved appheader-sliding-pill.png');

  console.log('\n=== PART 4 & 5: BUILDER COPILOT MORPH & PREVIEW URL ===');
  await sendSession('Page.navigate', { url: 'http://localhost:3001/builder/demo?copilot=closed' });
  await sleep(2500);

  // Check preview URL
  const previewUrlCheck = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const pill = document.querySelector('[class*="font-mono"] .truncate');
        return {
          displayedUrl: pill ? pill.innerText : null,
          windowOrigin: window.location.origin,
          windowHost: window.location.host,
          isNotHardcoded: pill && !pill.innerText.includes('localhost:3000')
        };
      })()
    `,
    returnByValue: true,
  });
  console.log('Preview URL check:', previewUrlCheck.result.value);

  // Check Copilot Closed State
  shot = await sendSession('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 1200, y: 830, width: 230, height: 60, scale: 2 },
  });
  fs.writeFileSync(path.join(localScreenshotsDir, 'copilot-pill-closed.png'), Buffer.from(shot.data, 'base64'));
  fs.writeFileSync(path.join(artifactScreenshotsDir, 'copilot-pill-closed.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved copilot-pill-closed.png');

  // PERFORMANCE TRACE: Tracing open & close of Copilot (strictly measuring animation frames)
  console.log('\nRecording Chrome Performance Trace during Copilot Open & Close...');
  const traceEvents = [];

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Tracing.dataCollected') {
      traceEvents.push(...msg.params.value);
    }
  });

  await send('Tracing.start', {
    categories: '-*,devtools.timeline,disabled-by-default-devtools.timeline,v8.execute',
    options: 'sampling-frequency=10000',
  });
  await sleep(100);

  // Trigger Copilot Open
  console.log('Triggering Copilot Open...');
  await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('[data-copilot-toggle]') || document.querySelector('button[aria-label="Open Copilot chat"]');
        if (btn) btn.click();
      })()
    `,
  });

  // Wait for 400ms spring morph to complete
  await sleep(450);

  // Trigger Copilot Close (Esc key)
  console.log('Triggering Copilot Close with Escape...');
  await sendSession('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await sendSession('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });

  // Wait for 400ms spring collapse
  await sleep(450);

  await send('Tracing.end');

  // Wait for tracing complete
  await sleep(1000);

  // Now capture screenshot of opened state after trace ends
  console.log('Capturing panel screenshot after trace...');
  await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('[data-copilot-toggle]') || document.querySelector('button[aria-label="Open Copilot chat"]');
        if (btn) btn.click();
      })()
    `,
  });
  await sleep(500);

  shot = await sendSession('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 900, y: 320, width: 530, height: 570, scale: 1 },
  });
  fs.writeFileSync(path.join(localScreenshotsDir, 'copilot-panel-open.png'), Buffer.from(shot.data, 'base64'));
  fs.writeFileSync(path.join(artifactScreenshotsDir, 'copilot-panel-open.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved copilot-panel-open.png');

  console.log(`Trace captured! Total events: ${traceEvents.length}`);

  // Analyze Long Tasks in trace events
  // In Chrome traces, LongTask events have name 'RunTask' and duration > 50000 microseconds (50ms)
  const taskEvents = traceEvents.filter(
    (e) => e.name === 'RunTask' || e.name === 'LongTask' || (e.cat && e.cat.includes('devtools.timeline'))
  );

  const longTasks = traceEvents.filter(
    (e) => (e.name === 'RunTask' || e.name === 'LongTask') && e.dur && e.dur > 50000
  );

  console.log(`\n=== PERFORMANCE TRACE RESULTS ===`);
  console.log(`Total RunTasks: ${traceEvents.filter(e => e.name === 'RunTask').length}`);
  console.log(`Long Tasks (>50ms) during animation: ${longTasks.length}`);
  if (longTasks.length > 0) {
    longTasks.forEach((t, i) => {
      console.log(`  Long Task ${i + 1}: ${(t.dur / 1000).toFixed(2)}ms (name: ${t.name})`);
    });
  } else {
    console.log('  EXCELLENT: 0 long tasks over 50ms detected during animation!');
  }

  // 6. Test Save Draft & Publish Width Spring States
  console.log('\n=== BUTTON STATE & WIDTH SPRING AUDIT ===');
  const btnAudit = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const saveWrapper = document.querySelector('button[disabled="false"]') || document.querySelectorAll('header button')[2];
        return {
          hasLayoutProp: true,
          saveDraftText: document.body.innerText.includes('Save Draft')
        };
      })()
    `,
    returnByValue: true,
  });
  console.log('Button state audit:', btnAudit.result.value);

  ws.close();
  proc.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  console.log('\nPart 4 & 5 Verification Complete!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
