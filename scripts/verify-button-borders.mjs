import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('.screenshots', 'button-borders');
fs.mkdirSync(outDir, { recursive: true });

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-cdp-btn-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9222 + Math.floor(Math.random() * 500);

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1440,900',
    '--device-scale-factor=2', // high DPR for crisp edge inspection
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

  async function captureClip(filename, clip) {
    const res = await sendSession('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: clip.x,
        y: clip.y,
        width: clip.width,
        height: clip.height,
        scale: 1,
      },
    });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(outDir, filename), buffer);
    console.log(`Saved crop: ${filename}`);
  }

  async function setTheme(theme) {
    await sendSession('Runtime.evaluate', {
      expression: `
        if ('${theme}' === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        }
      `,
    });
    await sleep(300);
  }

  // 1. Landing Page (/)
  console.log('Testing Landing page (/)...');
  await sendSession('Page.navigate', { url: 'http://localhost:3001/' });
  await sleep(2500);

  for (const theme of ['light', 'dark']) {
    await setTheme(theme);
    const coords = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const btnPrimary = document.querySelector('a[href*="/builder/demo"]');
          const btnSecondary = document.querySelector('a[href*="/templates"]');
          const card = document.querySelector('[data-testid="hero-code-card"]') || document.querySelector('.glass-1');
          if (!btnPrimary || !btnSecondary || !card) return null;
          const rP = btnPrimary.getBoundingClientRect();
          const rS = btnSecondary.getBoundingClientRect();
          const rC = card.getBoundingClientRect();
          return {
            btnPrimary: { x: rP.x, y: rP.y, width: rP.width, height: rP.height },
            btnSecondary: { x: rS.x, y: rS.y, width: rS.width, height: rS.height },
            card: { x: rC.x, y: rC.y, width: rC.width, height: rC.height },
            combined: {
              x: Math.min(rP.x, rC.x),
              y: rP.y - 10,
              width: Math.max(rS.right, rC.right) - Math.min(rP.x, rC.x),
              height: (rC.y + 120) - (rP.y - 10)
            }
          };
        })()
      `,
      returnByValue: true,
    });

    if (coords.result.value) {
      const { btnPrimary, btnSecondary, card, combined } = coords.result.value;
      // Crop of buttons right above card
      await captureClip(`landing-${theme}-buttons-and-card.png`, {
        x: Math.max(0, Math.round(btnPrimary.x - 20)),
        y: Math.max(0, Math.round(btnPrimary.y - 15)),
        width: Math.min(1400, Math.round(btnSecondary.x + btnSecondary.width - btnPrimary.x + 40)),
        height: Math.round(btnPrimary.height + 30),
      });

      // Close-up crop of Primary button edge
      await captureClip(`landing-${theme}-primary-edge.png`, {
        x: Math.max(0, Math.round(btnPrimary.x - 10)),
        y: Math.max(0, Math.round(btnPrimary.y - 10)),
        width: Math.round(btnPrimary.width + 20),
        height: Math.round(btnPrimary.height + 20),
      });

      // Close-up crop of Secondary button edge
      await captureClip(`landing-${theme}-secondary-edge.png`, {
        x: Math.max(0, Math.round(btnSecondary.x - 10)),
        y: Math.max(0, Math.round(btnSecondary.y - 10)),
        width: Math.round(btnSecondary.width + 20),
        height: Math.round(btnSecondary.height + 20),
      });

      // Close-up crop of Card top edge
      await captureClip(`landing-${theme}-card-edge.png`, {
        x: Math.max(0, Math.round(card.x)),
        y: Math.max(0, Math.round(card.y)),
        width: Math.round(card.width),
        height: 80,
      });
    }
  }

  // 2. Templates Page (/templates)
  console.log('Testing Templates page (/templates)...');
  await sendSession('Page.navigate', { url: 'http://localhost:3001/templates' });
  await sleep(2500);

  for (const theme of ['light', 'dark']) {
    await setTheme(theme);
    const tplCoords = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.grid > div');
          if (!card) return null;
          const rC = card.getBoundingClientRect();
          const btns = card.querySelectorAll('button, a[class*="btn"]');
          const rB1 = btns[0] ? btns[0].getBoundingClientRect() : null;
          const rB2 = btns[1] ? btns[1].getBoundingClientRect() : null;
          return {
            card: { x: rC.x, y: rC.y, width: rC.width, height: rC.height },
            btnPreview: rB1 ? { x: rB1.x, y: rB1.y, width: rB1.width, height: rB1.height } : null,
            btnUse: rB2 ? { x: rB2.x, y: rB2.y, width: rB2.width, height: rB2.height } : null,
          };
        })()
      `,
      returnByValue: true,
    });

    if (tplCoords.result.value) {
      const { card, btnPreview, btnUse } = tplCoords.result.value;
      // Capture whole template card showing buttons inside card container
      await captureClip(`templates-${theme}-card-with-buttons.png`, {
        x: Math.max(0, Math.round(card.x - 10)),
        y: Math.max(0, Math.round(card.y - 10)),
        width: Math.round(card.width + 20),
        height: Math.round(card.height + 20),
      });

      // Close-up crop of card bottom actions row (secondary Preview + primary Use template next to card border)
      if (btnPreview && btnUse) {
        await captureClip(`templates-${theme}-actions-edge-comparison.png`, {
          x: Math.max(0, Math.round(card.x)),
          y: Math.max(0, Math.round(btnPreview.y - 20)),
          width: Math.round(card.width),
          height: Math.round(card.height - (btnPreview.y - card.y) + 20),
        });
      }
    }
  }

  // 3. Builder Page (/builder/demo)
  console.log('Testing Builder page (/builder/demo)...');
  await sendSession('Page.navigate', { url: 'http://localhost:3001/builder/demo' });
  await sleep(2500);

  for (const theme of ['light', 'dark']) {
    await setTheme(theme);
    const builderCoords = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const header = document.querySelector('header');
          const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save Draft'));
          const publishBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Publish'));
          const editorHeader = document.querySelector('[aria-label="Code Editor and Validation Panel"]');
          if (!header || !saveBtn || !publishBtn) return null;
          const rH = header.getBoundingClientRect();
          const rS = saveBtn.getBoundingClientRect();
          const rP = publishBtn.getBoundingClientRect();
          const rE = editorHeader ? editorHeader.getBoundingClientRect() : null;
          return {
            header: { x: rH.x, y: rH.y, width: rH.width, height: rH.height },
            saveBtn: { x: rS.x, y: rS.y, width: rS.width, height: rS.height },
            publishBtn: { x: rP.x, y: rP.y, width: rP.width, height: rP.height },
            editor: rE ? { x: rE.x, y: rE.y, width: rE.width, height: rE.height } : null,
          };
        })()
      `,
      returnByValue: true,
    });

    if (builderCoords.result.value) {
      const { saveBtn, publishBtn, header, editor } = builderCoords.result.value;
      // Crop of Toolbar buttons next to header bottom edge and editor pane top
      await captureClip(`builder-${theme}-toolbar-buttons-and-edge.png`, {
        x: Math.max(0, Math.round(saveBtn.x - 30)),
        y: Math.max(0, Math.round(header.y)),
        width: Math.round(publishBtn.x + publishBtn.width - saveBtn.x + 60),
        height: Math.round(header.height + 60),
      });
    }
  }

  // 4. Apps Page (/apps)
  console.log('Testing Apps page (/apps)...');
  await sendSession('Page.navigate', { url: 'http://localhost:3001/apps' });
  await sleep(2500);

  for (const theme of ['light', 'dark']) {
    await setTheme(theme);
    const appsCoords = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const newAppBtn = Array.from(document.querySelectorAll('button, a')).find(b => b.textContent.includes('New app'));
          const card = document.querySelector('[role="link"]');
          const promptBox = document.querySelector('.glass-1');
          if (!newAppBtn) return null;
          const rN = newAppBtn.getBoundingClientRect();
          const rC = card ? card.getBoundingClientRect() : null;
          const rP = promptBox ? promptBox.getBoundingClientRect() : null;
          return {
            newAppBtn: { x: rN.x, y: rN.y, width: rN.width, height: rN.height },
            card: rC ? { x: rC.x, y: rC.y, width: rC.width, height: rC.height } : null,
            promptBox: rP ? { x: rP.x, y: rP.y, width: rP.width, height: rP.height } : null,
          };
        })()
      `,
      returnByValue: true,
    });

    if (appsCoords.result.value) {
      const { newAppBtn, card, promptBox } = appsCoords.result.value;
      await captureClip(`apps-${theme}-new-app-button.png`, {
        x: Math.max(0, Math.round(newAppBtn.x - 20)),
        y: Math.max(0, Math.round(newAppBtn.y - 15)),
        width: Math.round(newAppBtn.width + 40),
        height: Math.round(newAppBtn.height + 30),
      });

      if (promptBox) {
        await captureClip(`apps-${theme}-prompt-card-edge.png`, {
          x: Math.max(0, Math.round(promptBox.x)),
          y: Math.max(0, Math.round(promptBox.y)),
          width: Math.round(promptBox.width),
          height: 100,
        });
      }
    }
  }

  ws.close();
  proc.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  console.log('Button borders verification completed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
