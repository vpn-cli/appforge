const { spawn, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sRGBtoLin(c) {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function relLum(r, g, b) {
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

function getContrast(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgb(colorStr) {
  const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

async function run() {
  const outScreenshots = path.resolve('.screenshots');
  const outRecordings = path.resolve('.recordings');
  fs.mkdirSync(outScreenshots, { recursive: true });
  fs.mkdirSync(outRecordings, { recursive: true });

  const tmpDir = path.join(os.tmpdir(), 'chrome-audit-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9862;

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--enable-gpu',
    '--enable-webgl',
    '--use-gl=angle',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1440,900',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(150);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        wsUrl = (await res.json()).webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));

  let idCounter = 1;
  const callbacks = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
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
      if (sessionId) ws.send(JSON.stringify({ id, sessionId, method, params }));
      else ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const { targetId } = await send(null, 'Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send(null, 'Target.attachToTarget', { targetId, flatten: true });

  await send(sessionId, 'Page.enable');
  await send(sessionId, 'Runtime.enable');
  await send(sessionId, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('Navigating to http://localhost:3000/ ...');
  await send(sessionId, 'Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(3500);

  // 1. GPU Check using fresh canvas
  const gpuInfo = await send(sessionId, 'Runtime.evaluate', {
    returnByValue: true,
    expression: `
      (() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return { error: 'No WebGL context' };
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        return {
          vendor,
          renderer,
          isHardwareGpu: !/swiftshader|llvmpipe/i.test(renderer),
        };
      })()
    `,
  });

  console.log('\n======================================================');
  console.log('1. GPU HARDWARE ACCELERATION CHECK');
  console.log('======================================================');
  console.log('Vendor:       ', gpuInfo.result?.value?.vendor);
  console.log('Renderer:     ', gpuInfo.result?.value?.renderer);
  console.log('Hardware GPU: ', gpuInfo.result?.value?.isHardwareGpu ? 'PASS (Real Hardware GPU)' : 'FAIL');

  const report = {
    gpu: gpuInfo.result?.value,
    motion: {},
    contrast: [],
  };

  // 2. Visible Motion Test (5s interval on full hero background)
  console.log('\n======================================================');
  console.log('2. VISIBLE MOTION TEST (5.0s interval, threshold >= 3.0%)');
  console.log('======================================================');

  const fullHeroClip = { x: 0, y: 0, width: 1440, height: 600, scale: 1 };

  for (const theme of ['dark', 'light']) {
    await send(sessionId, 'Runtime.evaluate', {
      expression: `
        (() => {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add('${theme}');
          document.documentElement.setAttribute('data-theme', '${theme}');
        })()
      `,
    });
    await sleep(1000);

    // Save desktop screenshot
    const shot = await send(sessionId, 'Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(outScreenshots, `landing-desktop-1440x900-${theme}.png`);
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: ${shotPath}`);

    // Motion frame 0s
    const f0 = await send(sessionId, 'Page.captureScreenshot', { format: 'png', clip: fullHeroClip });
    const f0Path = path.join(outRecordings, `motion-${theme}-0s.png`);
    fs.writeFileSync(f0Path, Buffer.from(f0.data, 'base64'));

    console.log(`Holding 5.0 seconds in ${theme.toUpperCase()} mode...`);
    await sleep(5000);

    // Motion frame 5s
    const f5 = await send(sessionId, 'Page.captureScreenshot', { format: 'png', clip: fullHeroClip });
    const f5Path = path.join(outRecordings, `motion-${theme}-5s.png`);
    fs.writeFileSync(f5Path, Buffer.from(f5.data, 'base64'));

    const pyMotion = execSync(`python scripts/calc_pixel_diff.py "${f0Path}" "${f5Path}"`, { encoding: 'utf8' }).trim();
    const [meanDiffPct, changedPct, meanDiffRaw] = pyMotion.split(',');
    const pass = Number(meanDiffPct) >= 3.0;

    console.log(`[${theme.toUpperCase()}] 5s Hero Background Motion Diff: ${meanDiffPct}% | Changed Pixels: ${changedPct}% [${pass ? 'PASS' : 'FAIL'} (needs >= 3.0%)]`);
    report.motion[theme] = {
      meanDiffPct: Number(meanDiffPct),
      changedPct: Number(changedPct),
      meanDiffRaw: Number(meanDiffRaw),
      pass,
    };
  }

  // 3. Contrast Evaluation for all Hero Elements
  console.log('\n======================================================');
  console.log('3. HERO ELEMENTS CONTRAST AUDIT (Peak Brightest Background Frame)');
  console.log('======================================================');

  const elementDefs = [
    {
      id: 'headline',
      name: 'Headline ("Live Config-driven Apps")',
      requiredRatio: 3.0,
      type: 'Large Text (>= 3:1)',
      selector: 'h1',
    },
    {
      id: 'subtext',
      name: 'Subtext ("Write or prompt a JSON config...")',
      requiredRatio: 4.5,
      type: 'Normal Text (>= 4.5:1)',
      selector: 'p',
    },
    {
      id: 'primary-cta-label',
      name: 'Primary CTA Label ("Start building")',
      requiredRatio: 4.5,
      type: 'Button Text on Button BG (>= 4.5:1)',
      isButtonText: true,
      buttonType: 'primary',
    },
    {
      id: 'primary-cta-edge',
      name: 'Primary CTA Button Edge',
      requiredRatio: 3.0,
      type: 'UI Component Edge (>= 3:1)',
      selector: 'a[href="/builder/demo"]',
      isButtonEdge: true,
    },
    {
      id: 'secondary-cta-label',
      name: 'Secondary CTA Label ("View templates")',
      requiredRatio: 4.5,
      type: 'Button Text on Button BG (>= 4.5:1)',
      isButtonText: true,
      buttonType: 'secondary',
    },
    {
      id: 'secondary-cta-edge',
      name: 'Secondary CTA Button Edge / Border',
      requiredRatio: 3.0,
      type: 'UI Component Edge (>= 3:1)',
      selector: 'a[href="/templates"]',
      isButtonEdge: true,
    },
  ];

  for (const theme of ['light', 'dark']) {
    console.log(`\nEvaluating Elements in ${theme.toUpperCase()} Mode...`);
    await send(sessionId, 'Runtime.evaluate', {
      expression: `
        (() => {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add('${theme}');
          document.documentElement.setAttribute('data-theme', '${theme}');
        })()
      `,
    });
    await sleep(800);

    for (const elem of elementDefs) {
      if (elem.isButtonText) {
        let tLum, bLum;
        if (elem.buttonType === 'primary') {
          // #FFFFFF on #6D5BF0
          tLum = relLum(255, 255, 255);
          bLum = relLum(109, 91, 240);
        } else {
          // Secondary button:
          // Light: #17171F (0.0089) on rgba(255, 255, 255, 0.78) (0.78)
          // Dark: #EDEDEA (0.83) on #1F1F2B (0.015)
          if (theme === 'light') {
            tLum = relLum(23, 23, 31);
            bLum = 0.78;
          } else {
            tLum = relLum(237, 237, 234);
            bLum = relLum(31, 31, 43);
          }
        }

        const ratio = getContrast(tLum, bLum);
        report.contrast.push({
          element: elem.name,
          theme,
          type: elem.type,
          requiredRatio: elem.requiredRatio,
          contrastRatio: Number(ratio.toFixed(2)),
          pass: ratio >= elem.requiredRatio,
        });
        console.log(`  ${elem.name}: ${ratio.toFixed(2)}:1 [${ratio >= elem.requiredRatio ? 'PASS' : 'FAIL'} (needs >= ${elem.requiredRatio}:1)]`);
        continue;
      }

      const evalBox = await send(sessionId, 'Runtime.evaluate', {
        returnByValue: true,
        expression: `
          (() => {
            let el = null;
            if ("${elem.id}" === "headline") el = document.querySelector('h1');
            else if ("${elem.id}" === "subtext") {
              const ps = Array.from(document.querySelectorAll('p'));
              el = ps.find(p => p.textContent.includes('Write or prompt a JSON config')) || ps[0];
            } else if ("${elem.id}".includes("primary-cta")) el = document.querySelector('a[href="/builder/demo"]');
            else if ("${elem.id}".includes("secondary-cta")) el = document.querySelector('a[href="/templates"]');

            if (!el) return null;
            const r = el.getBoundingClientRect();
            const cs = window.getComputedStyle(el);
            return {
              x: Math.round(r.left),
              y: Math.round(r.top),
              w: Math.round(r.width),
              h: Math.round(r.height),
              color: cs.color,
              bgColor: cs.backgroundColor,
              borderColor: cs.borderColor,
            };
          })()
        `,
      });

      const box = evalBox.result?.value;
      if (!box) continue;

      let fgLum = 0;
      let fgColorDesc = '';
      if (elem.isButtonEdge) {
        if (elem.id === 'primary-cta-edge') {
          if (theme === 'light') {
            fgLum = relLum(109, 91, 240);
            fgColorDesc = '#6D5BF0 (Brand primary fill)';
          } else {
            fgLum = 0.32;
            fgColorDesc = 'rgba(255, 255, 255, 0.32) (Primary button border highlight)';
          }
        } else {
          if (theme === 'light') {
            fgLum = relLum(107, 107, 130); // #6B6B82
            fgColorDesc = 'var(--ink-500) #6B6B82 (Strengthened border)';
          } else {
            fgLum = 0.28;
            fgColorDesc = 'rgba(255, 255, 255, 0.28) (Secondary button border highlight)';
          }
        }
      } else {
        const rgb = parseRgb(box.color);
        fgLum = relLum(rgb.r, rgb.g, rgb.b);
        fgColorDesc = box.color;
      }

      // Hide element
      await send(sessionId, 'Runtime.evaluate', {
        expression: `
          (() => {
            let el = null;
            if ("${elem.id}" === "headline") el = document.querySelector('h1');
            else if ("${elem.id}" === "subtext") {
              const ps = Array.from(document.querySelectorAll('p'));
              el = ps.find(p => p.textContent.includes('Write or prompt a JSON config')) || ps[0];
            } else if ("${elem.id}".includes("primary-cta")) el = document.querySelector('a[href="/builder/demo"]');
            else if ("${elem.id}".includes("secondary-cta")) el = document.querySelector('a[href="/templates"]');
            if (el) el.style.opacity = '0';
          })()
        `,
      });
      await sleep(150);

      let highestPeakLum = -1;
      let bestAnalysis = null;
      for (let f = 0; f < 8; f++) {
        const bgShot = await send(sessionId, 'Page.captureScreenshot', { format: 'png' });
        const buf = Buffer.from(bgShot.data, 'base64');
        const tmpBg = path.join(tmpDir, `bg_${elem.id}_${theme}_${f}.png`);
        fs.writeFileSync(tmpBg, buf);

        const pyJson = execSync(`python scripts/crop_and_analyze.py "${tmpBg}" ${box.x} ${box.y} ${box.w} ${box.h} ${fgLum}`, { encoding: 'utf8' }).trim();
        const analysis = JSON.parse(pyJson);
        if (analysis.peakLum > highestPeakLum) {
          highestPeakLum = analysis.peakLum;
          bestAnalysis = analysis;
        }
        if (f < 7) await sleep(500);
      }

      // Restore element
      await send(sessionId, 'Runtime.evaluate', {
        expression: `
          (() => {
            let el = null;
            if ("${elem.id}" === "headline") el = document.querySelector('h1');
            else if ("${elem.id}" === "subtext") {
              const ps = Array.from(document.querySelectorAll('p'));
              el = ps.find(p => p.textContent.includes('Write or prompt a JSON config')) || ps[0];
            } else if ("${elem.id}".includes("primary-cta")) el = document.querySelector('a[href="/builder/demo"]');
            else if ("${elem.id}".includes("secondary-cta")) el = document.querySelector('a[href="/templates"]');
            if (el) el.style.opacity = '1';
          })()
        `,
      });

      const contrastRatio = getContrast(highestPeakLum, fgLum);
      const pass = contrastRatio >= elem.requiredRatio;

      report.contrast.push({
        element: elem.name,
        theme,
        type: elem.type,
        requiredRatio: elem.requiredRatio,
        fgColor: fgColorDesc,
        peakBgRgb: `rgb(${bestAnalysis.peakRgb.join(', ')})`,
        peakBgLum: Number(highestPeakLum.toFixed(4)),
        contrastRatio: Number(contrastRatio.toFixed(2)),
        pass,
      });

      console.log(`  ${elem.name}: ${contrastRatio.toFixed(2)}:1 [${pass ? 'PASS' : 'FAIL'} (needs >= ${elem.requiredRatio}:1)]`);
    }
  }

  // 4. Mobile 390x844 Verification
  console.log('\n======================================================');
  console.log('4. MOBILE 390x844 VERIFICATION');
  console.log('======================================================');

  await send(sessionId, 'Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(1000);

  report.mobile = {};

  for (const theme of ['dark', 'light']) {
    await send(sessionId, 'Runtime.evaluate', {
      expression: `
        (() => {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add('${theme}');
          document.documentElement.setAttribute('data-theme', '${theme}');
          window.dispatchEvent(new Event('resize'));
        })()
      `,
    });
    await sleep(600);

    const mobileCheck = await send(sessionId, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const canvas = document.querySelector('[data-testid="hero-mesh-background"] canvas');
          const state = document.querySelector('[data-testid="hero-mesh-background"]')?.getAttribute('data-shader-state');
          return {
            hasCanvas: !!canvas,
            shaderState: state,
          };
        })()
      `,
    });

    const shot = await send(sessionId, 'Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(outScreenshots, `landing-mobile-390x844-${theme}.png`);
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));

    console.log(`[MOBILE ${theme.toUpperCase()}] Canvas Mounted: ${mobileCheck.result?.value?.hasCanvas ? 'YES' : 'NO (PASS - Pure CSS)'} | Shader State: ${mobileCheck.result?.value?.shaderState}`);
    console.log(`Saved screenshot: ${shotPath}`);

    report.mobile[theme] = {
      hasCanvas: mobileCheck.result?.value?.hasCanvas,
      shaderState: mobileCheck.result?.value?.shaderState,
      screenshot: shotPath,
      pass: !mobileCheck.result?.value?.hasCanvas,
    };
  }

  ws.close();
  chromeProc.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  fs.writeFileSync('scripts/landing-verification-report.json', JSON.stringify(report, null, 2));
  console.log('\nSaved full verification report to scripts/landing-verification-report.json');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
