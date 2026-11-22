const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function recordStream({ engine = 'paper', theme = 'light', width = 1440, height = 900, durationSec = 10 }) {
  console.log(`\n------------------------------------------------------------`);
  console.log(`Capturing: Engine = ${engine.toUpperCase()} | Theme = ${theme.toUpperCase()} (${durationSec}s)`);
  console.log(`------------------------------------------------------------`);

  const tmpDir = path.join(os.tmpdir(), `chrome-rec-${engine}-${theme}-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const framesDir = path.resolve(`.recordings/raw-${engine}-${theme}`);
  if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const outDir = path.resolve('.recordings');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const port = 9700 + Math.floor(Math.random() * 250);

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--enable-gpu',
    '--enable-webgl',
    '--use-gl=angle',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    `--window-size=${width},${height}`,
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
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
  await new Promise((r) => (ws.onopen = r));

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

  try {
    const { targetId } = await send(null, 'Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send(null, 'Target.attachToTarget', { targetId, flatten: true });

    await send(sessionId, 'Page.enable');
    await send(sessionId, 'Runtime.enable');
    await send(sessionId, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Inject engine preference before load
    await send(sessionId, 'Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__SHADER_ENGINE = '${engine}';
        localStorage.setItem('theme', '${theme}');
      `
    });

    const targetUrl = `http://localhost:3001/?shader=${engine}`;
    console.log(`Navigating to ${targetUrl} ...`);
    await send(sessionId, 'Page.navigate', { url: targetUrl });
    await sleep(2500);

    // Apply theme class, hide dev overlays, and inject clean label badge
    await send(sessionId, 'Runtime.evaluate', {
      expression: `
        try {
          const style = document.createElement('style');
          style.innerHTML = 'nextjs-portal, [data-nextjs-toast], [data-next-badge], [class*="nextjs-portal"] { display: none !important; }';
          document.head.appendChild(style);
        } catch(e) {}

        if ('${theme}' === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }

        const label = '${engine}' === 'paper' ? 'Current: Paper Shaders (0.0.82)' : 'New: Native Mesh Shader (0 dep, KHR)';
        const badge = document.createElement('div');
        badge.id = 'shader-label-badge';
        badge.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(15,15,22,0.92);color:#ffffff;padding:8px 22px;border-radius:9999px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.02em;border:1px solid rgba(255,255,255,0.25);box-shadow:0 8px 24px rgba(0,0,0,0.5);pointer-events:none;';
        badge.innerText = label;
        document.body.appendChild(badge);
      `
    });
    await sleep(800);

    // Verify which shader is mounted
    const shaderCheck = await send(sessionId, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const native = !!document.querySelector('[data-testid="native-mesh-shader"]');
        const paper = !!document.querySelector('.hero-mesh-mask paper-shader-mesh-gradient, .hero-mesh-mask canvas');
        return { native, paper };
      })()`
    });
    console.log(`Shader detection on page:`, shaderCheck.result.value);

    console.log(`Recording ${durationSec}s screencast frames...`);
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
      quality: 92,
      everyNthFrame: 1,
    });

    await sleep(durationSec * 1000 + 400);

    await send(sessionId, 'Page.stopScreencast');
    console.log(`Captured ${frameCount} frames for ${engine}-${theme}.`);

    const screenshotPath = path.join(outDir, `shot-${engine}-${theme}.png`);
    const { data: shotData } = await send(sessionId, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(screenshotPath, Buffer.from(shotData, 'base64'));

    // Encode single mp4
    const singleMp4 = path.join(outDir, `single-${engine}-${theme}.mp4`);
    const fps = Math.max(12, Math.round(frameCount / durationSec));
    execSync(
      `ffmpeg -y -framerate ${fps} -i "${path.join(framesDir, 'frame_%05d.jpg')}" -c:v libx264 -pix_fmt yuv420p "${singleMp4}"`,
      { stdio: 'ignore' }
    );
    console.log(`Saved single video: ${path.basename(singleMp4)}`);

    return {
      engine,
      theme,
      singleMp4,
      screenshotPath,
      frameCount,
      fps,
    };
  } finally {
    ws.close();
    try {
      execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
    } catch {}
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

async function compositeSideBySide(theme, paperRes, nativeRes) {
  const outDir = path.resolve('.recordings');
  const sideBySideMp4 = path.join(outDir, `side-by-side-${theme}.mp4`);
  const sideBySideGif = path.join(outDir, `side-by-side-${theme}.gif`);
  const sideBySidePng = path.join(outDir, `side-by-side-${theme}.png`);

  console.log(`\n============================================================`);
  console.log(`Compositing Side-by-Side (${theme.toUpperCase()}): Paper vs Native`);
  console.log(`============================================================`);

  // Side-by-side screenshot using ffmpeg
  const shotFilter = `[0:v]scale=720:450[left]; [1:v]scale=720:450[right]; [left][right]hstack=inputs=2`;
  execSync(
    `ffmpeg -y -i "${paperRes.screenshotPath}" -i "${nativeRes.screenshotPath}" -filter_complex "${shotFilter}" -update 1 "${sideBySidePng}"`,
    { stdio: 'ignore' }
  );
  console.log(`Saved side-by-side screenshot: ${path.basename(sideBySidePng)}`);

  // Side-by-side video using ffmpeg hstack
  const videoFilter = `[0:v]scale=720:450[left]; [1:v]scale=720:450[right]; [left][right]hstack=inputs=2[v]`;

  execSync(
    `ffmpeg -y -i "${paperRes.singleMp4}" -i "${nativeRes.singleMp4}" -filter_complex "${videoFilter}" -map "[v]" -c:v libx264 -pix_fmt yuv420p "${sideBySideMp4}"`,
    { stdio: 'ignore' }
  );
  console.log(`Saved side-by-side video: ${path.basename(sideBySideMp4)}`);

  console.log(`Encoding optimized side-by-side GIF...`);
  execSync(
    `ffmpeg -y -i "${sideBySideMp4}" -vf "fps=12,scale=1080:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" "${sideBySideGif}"`,
    { stdio: 'ignore' }
  );
  console.log(`Saved side-by-side GIF: ${path.basename(sideBySideGif)}`);
}

async function main() {
  console.log('================================================================');
  console.log(' 10-Second Side-by-Side Shader Recording Suite');
  console.log(' Comparing Current Paper Shaders vs New Native Mesh Shader');
  console.log(' Themes: Light & Dark | 1440x900 Hero Viewport');
  console.log('================================================================');

  // 1. Record Paper in Light & Dark
  const paperLight = await recordStream({ engine: 'paper', theme: 'light', durationSec: 10 });
  const paperDark = await recordStream({ engine: 'paper', theme: 'dark', durationSec: 10 });

  // 2. Record Native in Light & Dark
  const nativeLight = await recordStream({ engine: 'native', theme: 'light', durationSec: 10 });
  const nativeDark = await recordStream({ engine: 'native', theme: 'dark', durationSec: 10 });

  // 3. Composite Side-by-Side outputs
  await compositeSideBySide('light', paperLight, nativeLight);
  await compositeSideBySide('dark', paperDark, nativeDark);

  console.log('\n================================================================');
  console.log(' All recordings and side-by-side composites complete!');
  console.log(' Output artifacts located in .recordings/:');
  console.log('   - side-by-side-light.mp4 & side-by-side-light.gif');
  console.log('   - side-by-side-dark.mp4 & side-by-side-dark.gif');
  console.log('   - side-by-side-light.png & side-by-side-dark.png');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Recording error:', err);
  process.exit(1);
});
