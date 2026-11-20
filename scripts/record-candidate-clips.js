const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function recordCandidate({ candidateId, fileName, durationMs = 10000 }) {
  console.log(`\n======================================================`);
  console.log(`Recording Candidate ${candidateId}: ${fileName} (${durationMs / 1000}s)`);
  console.log(`======================================================`);

  const tmpDir = path.join(os.tmpdir(), `chrome-record-${candidateId}-` + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmpDir, { recursive: true });

  const framesDir = path.resolve(`.recordings/frames-${candidateId}`);
  if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const outDir = path.resolve('.recordings');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const port = 9600 + Math.floor(Math.random() * 300);

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1520,1100',
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

  let frameCount = 0;
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Page.screencastFrame') {
      const { data, sessionId: sId } = msg.params;
      frameCount++;
      const frameFile = path.join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.jpg`);
      fs.writeFileSync(frameFile, Buffer.from(data, 'base64'));
      send(sessionId, 'Page.screencastFrameAck', { sessionId: sId }).catch(() => {});
      return;
    }

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
    width: 1520,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log(`Navigating to http://localhost:3000/dev/backgrounds ...`);
  await send(sessionId, 'Page.navigate', { url: 'http://localhost:3000/dev/backgrounds' });
  await sleep(3000);

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

  // Scroll candidate into view
  console.log(`Scrolling ${candidateId} into view...`);
  await send(sessionId, 'Runtime.evaluate', {
    expression: `
      const el = document.getElementById("${candidateId}");
      if (el) el.scrollIntoView({ block: "start", behavior: "instant" });
    `,
  });
  await sleep(1000);

  // Capture still screenshot
  const screenshotRes = await send(sessionId, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, `${fileName}-still.png`), Buffer.from(screenshotRes.data, 'base64'));
  console.log(`Saved screenshot: .recordings/${fileName}-still.png`);

  // Start Screencast
  console.log(`Streaming screencast for ${durationMs / 1000}s...`);
  await send(sessionId, 'Page.startScreencast', {
    format: 'jpeg',
    quality: 85,
    everyNthFrame: 1,
  });

  await sleep(durationMs);

  await send(sessionId, 'Page.stopScreencast');
  console.log(`Captured ${frameCount} screencast frames.`);

  // Cleanup Chrome
  ws.close();
  try {
    execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
  } catch {}
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  // Encode with ffmpeg
  const mp4Path = path.join(outDir, `${fileName}.mp4`);
  const effectiveFps = Math.max(15, Math.round(frameCount / (durationMs / 1000)));
  console.log(`Encoding video to ${mp4Path} at ${effectiveFps} fps...`);
  execSync(
    `ffmpeg -y -framerate ${effectiveFps} -i "${framesDir}/frame_%05d.jpg" -c:v libx264 -pix_fmt yuv420p -crf 23 -preset fast "${mp4Path}"`,
    { stdio: 'ignore' }
  );

  // Clean frames
  try { fs.rmSync(framesDir, { recursive: true, force: true }); } catch {}

  const stats = fs.statSync(mp4Path);
  console.log(`✓ Finished ${fileName}.mp4 (${(stats.size / 1024).toFixed(1)} KB, ${effectiveFps} fps)`);
}

async function main() {
  const candidates = [
    { candidateId: 'candidate-a', fileName: 'candidate-a-meshgradient' },
    { candidateId: 'candidate-b', fileName: 'candidate-b-aurora' },
    { candidateId: 'candidate-c', fileName: 'candidate-c-iridescence' },
    { candidateId: 'candidate-d', fileName: 'candidate-d-video' },
  ];

  for (const c of candidates) {
    await recordCandidate(c);
  }

  console.log('\nAll 4 candidate recordings complete!');
}

main().catch((err) => {
  console.error('Error recording clips:', err);
  process.exit(1);
});
