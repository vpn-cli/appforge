const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function recordOneTheme({ theme = 'light', width = 1440, height = 900 }) {
  console.log(`\n========================================`);
  console.log(`Recording Hero Loop: theme = ${theme} (1440x900)`);
  console.log(`========================================`);

  const tmpDir = path.join(os.tmpdir(), `chrome-record-${theme}-` + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmpDir, { recursive: true });

  const framesDir = path.resolve(`.recordings/frames-${theme}`);
  if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const outDir = path.resolve('.recordings');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const screenshotsDir = path.resolve('.screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

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
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(msg.error);
      else cb.resolve(msg.result);
    }
  };

  function send(sessionId, method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      callbacks.set(id, { resolve, reject });
      if (sessionId) {
        ws.send(JSON.stringify({ id, sessionId, method, params }));
      } else {
        ws.send(JSON.stringify({ id, method, params }));
      }
    });
  }

  const { targetId } = await send(null, 'Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send(null, 'Target.attachToTarget', { targetId, flatten: true });

  await send(sessionId, 'Page.enable');
  await send(sessionId, 'Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log(`Navigating to http://localhost:3000 ...`);
  await send(sessionId, 'Page.navigate', { url: 'http://localhost:3000' });
  await sleep(2500);

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

  // Set theme
  if (theme === 'dark') {
    await send(sessionId, 'Runtime.evaluate', {
      expression: 'document.documentElement.classList.add("dark"); document.documentElement.style.colorScheme = "dark"; localStorage.setItem("theme", "dark");',
    });
  } else {
    await send(sessionId, 'Runtime.evaluate', {
      expression: 'document.documentElement.classList.remove("dark"); document.documentElement.style.colorScheme = "light"; localStorage.setItem("theme", "light");',
    });
  }
  await sleep(500);

  // Reset hero animation to t=0
  await send(sessionId, 'Runtime.evaluate', {
    expression: `
      if (window.__heroController) {
        window.__heroController.reset();
      }
    `,
  });

  console.log(`Starting screencast frame capture for 12.5s loop...`);
  let frameCount = 0;

  ws.addEventListener('message', async (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Page.screencastFrame') {
      const { data, sessionId: sId } = msg.params;
      frameCount++;
      const frameFile = path.join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.jpg`);
      fs.writeFileSync(frameFile, Buffer.from(data, 'base64'));
      send(sessionId, 'Page.screencastFrameAck', { sessionId: sId }).catch(() => {});
    }
  });

  await send(sessionId, 'Page.startScreencast', {
    format: 'jpeg',
    quality: 90,
    everyNthFrame: 1,
  });

  // Record for 12.4 seconds
  await sleep(12400);

  await send(sessionId, 'Page.stopScreencast');
  console.log(`Captured ${frameCount} screencast frames.`);

  // Fast forward to t=5500 (full live updated state) to capture high-res static screenshot
  await send(sessionId, 'Runtime.evaluate', {
    expression: `if (window.__heroController) window.__heroController.setTime(5500);`,
  });
  await sleep(400);

  const screenshotPath = path.join(screenshotsDir, `landing-1440-${theme}.png`);
  const { data: shotData } = await send(sessionId, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(screenshotPath, Buffer.from(shotData, 'base64'));
  console.log(`Saved screenshot: ${path.basename(screenshotPath)} (1440x900, ${theme})`);

  ws.close();
  try {
    execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
  } catch {}
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  // Encode frames to video and gif with ffmpeg
  if (frameCount > 10) {
    const mp4Path = path.join(outDir, `hero-loop-${theme}.mp4`);
    const gifPath = path.join(outDir, `hero-loop-${theme}.gif`);

    console.log(`Encoding MP4 with ffmpeg...`);
    // Screencast fps is roughly frameCount / 12.4
    const fps = Math.max(12, Math.round(frameCount / 12.4));
    execSync(`ffmpeg -y -framerate ${fps} -i "${path.join(framesDir, 'frame_%05d.jpg')}" -c:v libx264 -pix_fmt yuv420p "${mp4Path}"`, { stdio: 'ignore' });
    console.log(`Saved video: ${path.basename(mp4Path)}`);

    console.log(`Encoding optimized GIF with ffmpeg...`);
    execSync(`ffmpeg -y -i "${mp4Path}" -vf "fps=14,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" "${gifPath}"`, { stdio: 'ignore' });
    console.log(`Saved GIF: ${path.basename(gifPath)}`);
  }
}

async function main() {
  await recordOneTheme({ theme: 'light' });
  await recordOneTheme({ theme: 'dark' });
  console.log('\nAll captures and recordings completed successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
