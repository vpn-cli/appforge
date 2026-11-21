import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\vipin\\.gemini\\antigravity\\brain\\9d5bfbfa-3126-4346-a9f1-e8bef7c43c6d';
const SCREENSHOT_DIR = path.resolve('.screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runAcceptanceVerification() {
  console.log('=== STARTING ACCEPTANCE VERIFICATION & CAPTURE ===\n');

  const tmpDir = path.join(os.tmpdir(), 'chrome-audit-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9320 + Math.floor(Math.random() * 50);

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
    throw new Error('Failed to connect to Chrome on port ' + port);
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

  function createSession(sessionId) {
    return function sendSession(method, params = {}) {
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
    };
  }

  async function captureAndSave(sendSession, filename) {
    const { data } = await sendSession('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    
    // Save to local .screenshots
    const localPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(localPath, buffer);

    // Save to artifact directory
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(artifactPath, buffer);

    console.log(`  ✓ Saved ${filename} (${buffer.length} bytes) to artifacts`);
  }

  const results = {};

  // 1. Landing Page (Light & Dark) + Ribbon Check in Dark Mode
  console.log('--- 1. Testing Landing Page & Dark Ribbon Exclusion ---');
  {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const sendSession = createSession(sessionId);

    await sendSession('Page.enable');
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
      mobile: false,
    });

    await sendSession('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(2500);

    // Light Theme Capture
    await sendSession('Runtime.evaluate', {
      expression: "document.documentElement.classList.remove('dark'); document.documentElement.style.colorScheme='light';",
    });
    await sleep(600);
    await captureAndSave(sendSession, 'landing-light.png');

    // Switch to Dark Theme
    await sendSession('Runtime.evaluate', {
      expression: "document.documentElement.classList.add('dark'); document.documentElement.style.colorScheme='dark';",
    });
    await sleep(600);
    await captureAndSave(sendSession, 'landing-dark.png');

    // Query Ribbon in Dark Mode
    const ribbonCheck = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const ribbonEl = document.querySelector('[data-ribbon-container]');
        const canvasEls = document.querySelectorAll('canvas');
        return {
          hasRibbonContainer: !!ribbonEl,
          canvasCount: canvasEls.length,
          canvasDetails: Array.from(canvasEls).map(c => ({
            id: c.id,
            className: c.className,
            offsetParent: c.offsetParent !== null,
            computedDisplay: window.getComputedStyle(c).display
          }))
        };
      })()`,
      returnByValue: true,
    });

    results.darkRibbonCheck = ribbonCheck.result.value;
    console.log('  Dark Ribbon Check:', JSON.stringify(results.darkRibbonCheck, null, 2));

    await send('Target.closeTarget', { targetId });
  }

  // 2. Apps Page (/dashboard) (Light & Dark)
  console.log('\n--- 2. Testing Apps / Dashboard Page ---');
  {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const sendSession = createSession(sessionId);

    await sendSession('Page.enable');
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
      mobile: false,
    });

    await sendSession('Page.navigate', { url: 'http://localhost:3000/dashboard' });
    await sleep(2500);

    // Light
    await sendSession('Runtime.evaluate', {
      expression: "document.documentElement.classList.remove('dark'); document.documentElement.style.colorScheme='light';",
    });
    await sleep(600);
    await captureAndSave(sendSession, 'apps-light.png');

    // Dark
    await sendSession('Runtime.evaluate', {
      expression: "document.documentElement.classList.add('dark'); document.documentElement.style.colorScheme='dark';",
    });
    await sleep(600);
    await captureAndSave(sendSession, 'apps-dark.png');

    // Inspect Dark Card and Nav computed styles
    const stylesCheck = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const nav = document.querySelector('header');
        const card = document.querySelector('[class*="border-border"]');
        const getStyles = (el) => {
          if (!el) return null;
          const s = window.getComputedStyle(el);
          return {
            backgroundColor: s.backgroundColor,
            backdropFilter: s.backdropFilter,
            borderColor: s.borderColor,
            borderRadius: s.borderRadius,
            boxShadow: s.boxShadow
          };
        };
        return {
          nav: getStyles(nav),
          card: getStyles(card)
        };
      })()`,
      returnByValue: true,
    });
    results.appsStylesCheck = stylesCheck.result.value;
    console.log('  Apps Styles Check:', JSON.stringify(results.appsStylesCheck, null, 2));

    await send('Target.closeTarget', { targetId });
  }

  // 3. Templates Page (/templates) (Light & Dark)
  console.log('\n--- 3. Testing Templates Page ---');
  {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const sendSession = createSession(sessionId);

    await sendSession('Page.enable');
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
      mobile: false,
    });

    await sendSession('Page.navigate', { url: 'http://localhost:3000/templates' });
    await sleep(2500);

    // Light
    await sendSession('Runtime.evaluate', {
      expression: "document.documentElement.classList.remove('dark'); document.documentElement.style.colorScheme='light';",
    });
    await sleep(600);
    await captureAndSave(sendSession, 'templates-light.png');

    // Dark
    await sendSession('Runtime.evaluate', {
      expression: "document.documentElement.classList.add('dark'); document.documentElement.style.colorScheme='dark';",
    });
    await sleep(600);
    await captureAndSave(sendSession, 'templates-dark.png');

    await send('Target.closeTarget', { targetId });
  }

  // 4. Builder Page (/builder/demo) (Light, Dark, and Floating Pill Expansion)
  console.log('\n--- 4. Testing Builder Page & Floating Chat Pill ---');
  {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const sendSession = createSession(sessionId);

    await sendSession('Page.enable');
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
      mobile: false,
    });

    await sendSession('Page.navigate', { url: 'http://localhost:3000/builder/demo' });
    await sleep(3000);

    // Light Builder
    await sendSession('Runtime.evaluate', {
      expression: "document.documentElement.classList.remove('dark'); document.documentElement.style.colorScheme='light';",
    });
    await sleep(600);
    await captureAndSave(sendSession, 'builder-light.png');

    // Dark Builder (Collapsed Pill)
    await sendSession('Runtime.evaluate', {
      expression: "document.documentElement.classList.add('dark'); document.documentElement.style.colorScheme='dark';",
    });
    await sleep(600);
    await captureAndSave(sendSession, 'builder-dark.png');

    // Check Floating Pill presence & dimensions before expansion
    const pillBefore = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const pillInput = document.querySelector('input[placeholder*="Ask Copilot"]');
        const pillContainer = pillInput ? pillInput.closest('[class*="fixed"], [class*="absolute"]') : null;
        if (!pillContainer) return { error: 'Pill container not found' };
        const rect = pillContainer.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          bottom: window.innerHeight - rect.bottom,
          left: rect.left,
          classes: pillContainer.className
        };
      })()`,
      returnByValue: true,
    });
    results.pillBefore = pillBefore.result.value;
    console.log('  Pill Before Focus:', JSON.stringify(results.pillBefore, null, 2));

    // Focus on pill input to expand
    await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const pillInput = document.querySelector('input[placeholder*="Ask Copilot"]');
        if (pillInput) {
          pillInput.focus();
        }
      })()`,
    });
    await sleep(600); // allow spring animation (~250ms)

    // Check dimensions after expansion
    const pillAfter = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const pillInput = document.querySelector('input[placeholder*="Ask Copilot"]');
        const pillContainer = pillInput ? pillInput.closest('[class*="fixed"], [class*="absolute"]') : null;
        if (!pillContainer) return { error: 'Pill container not found' };
        const rect = pillContainer.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          bottom: window.innerHeight - rect.bottom,
          left: rect.left
        };
      })()`,
      returnByValue: true,
    });
    results.pillAfter = pillAfter.result.value;
    console.log('  Pill After Expansion:', JSON.stringify(results.pillAfter, null, 2));

    await captureAndSave(sendSession, 'builder-copilot-pill-open.png');

    // Test Esc collapse
    await sendSession('Runtime.evaluate', {
      expression: `(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      })()`,
    });
    await sleep(400);

    const pillCollapsed = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const pillInput = document.querySelector('input[placeholder*="Ask Copilot"]');
        const pillContainer = pillInput ? pillInput.closest('[class*="fixed"], [class*="absolute"]') : null;
        if (!pillContainer) return { error: 'Pill container not found' };
        const rect = pillContainer.getBoundingClientRect();
        return {
          height: rect.height
        };
      })()`,
      returnByValue: true,
    });
    results.pillCollapsed = pillCollapsed.result.value;
    console.log('  Pill Collapsed Height:', results.pillCollapsed.height);

    await send('Target.closeTarget', { targetId });
  }

  ws.close();
  try {
    execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
  } catch {}
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
  
  // Save results JSON
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'verification-results.json'),
    JSON.stringify(results, null, 2)
  );

  return results;
}

runAcceptanceVerification().catch((err) => {
  console.error('Acceptance verification failed:', err);
  process.exit(1);
});

