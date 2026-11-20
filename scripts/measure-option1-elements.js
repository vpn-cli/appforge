const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
  const outDir = path.resolve('public/recordings/contrast-audit/option1');
  fs.mkdirSync(outDir, { recursive: true });

  const tmpDir = path.join(os.tmpdir(), 'chrome-opt1-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9880;

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1520,1100',
  ]);

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
  await send(sessionId, 'Emulation.setDeviceMetricsOverride', {
    width: 1520,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send(sessionId, 'Page.navigate', { url: 'http://localhost:3000/dev/backgrounds' });
  await sleep(4000);

  // Hide dev overlay badges
  await send(sessionId, 'Runtime.evaluate', {
    expression: `
      const s = document.createElement('style');
      s.innerHTML = 'nextjs-portal, [data-nextjs-toast], [data-next-badge], [class*="nextjs-portal"] { display: none !important; }';
      document.head.appendChild(s);
    `,
  });

  const allMeasurements = [];

  for (const targetTheme of ['light', 'dark']) {
    console.log(`\n======================================================`);
    console.log(`EVALUATING OPTION 1 (FIXED CANDIDATE A): ${targetTheme.toUpperCase()}`);
    console.log(`======================================================`);

    // Ensure next-themes theme is set via toggle button
    await send(sessionId, 'Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.getElementById("theme-toggle-btn");
          const isDark = btn ? btn.getAttribute("data-is-dark") === "true" : document.documentElement.classList.contains("dark");
          if ("${targetTheme}" === "dark" && !isDark) {
            if (btn) btn.click();
            else document.documentElement.classList.add("dark");
          } else if ("${targetTheme}" === "light" && isDark) {
            if (btn) btn.click();
            else document.documentElement.classList.remove("dark");
          }
        })()
      `,
    });
    await sleep(800);

    // Scroll candidate A card so hero is centered
    await send(sessionId, 'Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.getElementById("candidate-a");
          if (card) {
            const rect = card.getBoundingClientRect();
            window.scrollTo(0, window.scrollY + rect.top);
          }
        })()
      `,
    });
    await sleep(600);

    // Elements to evaluate inside candidate-a
    const elementDefs = [
      {
        id: 'headline',
        name: 'Headline ("Live Config-driven Apps")',
        requiredRatio: 3.0,
        type: 'Large Text (>= 3:1)',
        selector: '#candidate-a h1',
      },
      {
        id: 'subtext',
        name: 'Subtext ("Write or prompt a JSON config...")',
        requiredRatio: 4.5,
        type: 'Normal Text (>= 4.5:1)',
        selector: '#candidate-a p',
        filterText: 'Write or prompt a JSON config',
      },
      {
        id: 'primary-cta-label',
        name: 'Primary CTA Label ("Start building")',
        requiredRatio: 4.5,
        type: 'Button Text on Button BG (>= 4.5:1)',
        selector: '#candidate-a a[href="/builder/demo"]',
        isButton: true,
      },
      {
        id: 'primary-cta-edge',
        name: 'Primary CTA Button Edge',
        requiredRatio: 3.0,
        type: 'UI Component Edge (>= 3:1)',
        selector: '#candidate-a a[href="/builder/demo"]',
        isButtonEdge: true,
      },
      {
        id: 'secondary-cta-label',
        name: 'Secondary CTA Label ("View templates")',
        requiredRatio: 4.5,
        type: 'Button Text on Button BG (>= 4.5:1)',
        selector: '#candidate-a a[href="/templates"]',
        isButton: true,
      },
      {
        id: 'secondary-cta-edge',
        name: 'Secondary CTA Button Edge / Border',
        requiredRatio: 3.0,
        type: 'UI Component Edge (>= 3:1)',
        selector: '#candidate-a a[href="/templates"]',
        isButtonEdge: true,
      },
    ];

    for (const elemDef of elementDefs) {
      console.log(`\nEvaluating: ${elemDef.name}...`);

      // Extract bounding box and styles
      const evalRes = await send(sessionId, 'Runtime.evaluate', {
        returnByValue: true,
        expression: `
          (() => {
            const card = document.getElementById("candidate-a");
            if (!card) return { error: "candidate-a card not found" };

            let el = null;
            if ("${elemDef.id}" === "headline") {
              el = card.querySelector("h1");
            } else if ("${elemDef.id}" === "subtext") {
              const ps = Array.from(card.querySelectorAll("p"));
              el = ps.find(p => p.textContent.includes("Write or prompt a JSON config")) || ps[0];
            } else if ("${elemDef.id}".includes("primary-cta")) {
              el = card.querySelector('a[href="/builder/demo"]');
            } else if ("${elemDef.id}".includes("secondary-cta")) {
              el = card.querySelector('a[href="/templates"]');
            }

            if (!el) return { error: "element not found for ${elemDef.id}" };

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

      const box = evalRes?.result?.value;
      if (!box || box.error) {
        console.error(`  Failed to locate ${elemDef.id}:`, box?.error);
        continue;
      }

      console.log(`  Box: x=${box.x}, y=${box.y}, w=${box.w}, h=${box.h} | Color: ${box.color} | BG: ${box.bgColor}`);

      let fgLum = 0;
      let fgColorDesc = '';

      if (elemDef.isButton && !elemDef.isButtonEdge) {
        // Contrast of button text ON top of button background
        const textRgb = parseRgb(box.color);
        const bgRgb = parseRgb(box.bgColor.includes('rgba(0, 0, 0, 0)') ? (targetTheme === 'light' ? 'rgb(109, 91, 240)' : 'rgb(109, 91, 240)') : box.bgColor);
        const tLum = relLum(textRgb.r, textRgb.g, textRgb.b);
        const bLum = relLum(bgRgb.r, bgRgb.g, bgRgb.b);
        const buttonTextContrast = getContrast(tLum, bLum);

        console.log(`  Button Text Contrast (on its own bg): ${buttonTextContrast.toFixed(2)}:1`);

        allMeasurements.push({
          element: elemDef.name,
          theme: targetTheme,
          type: elemDef.type,
          requiredRatio: elemDef.requiredRatio,
          fgColor: box.color,
          bgColor: box.bgColor,
          contrastRatio: Number(buttonTextContrast.toFixed(2)),
          pass: buttonTextContrast >= elemDef.requiredRatio,
          annotatedScreenshot: `option1-candidate-a-${targetTheme}-${elemDef.id}-annotated.png`,
          bgCropScreenshot: `option1-candidate-a-${targetTheme}-${elemDef.id}-bg.png`,
        });
        continue;
      }

      // For text elements (headline, subtext) and button edges against hero background:
      if (elemDef.id === 'headline') {
        // Headline uses ink-900 in light, ink-50 in dark
        const rgb = parseRgb(box.color);
        fgLum = relLum(rgb.r, rgb.g, rgb.b);
        fgColorDesc = box.color;
      } else if (elemDef.id === 'subtext') {
        const rgb = parseRgb(box.color);
        fgLum = relLum(rgb.r, rgb.g, rgb.b);
        fgColorDesc = box.color;
      } else if (elemDef.isButtonEdge) {
        // Button boundary edge against the hero canvas
        const borderRgb = parseRgb(box.borderColor.includes('rgba(0, 0, 0, 0)') ? box.bgColor : box.borderColor);
        fgLum = relLum(borderRgb.r, borderRgb.g, borderRgb.b);
        fgColorDesc = box.borderColor.includes('rgba(0, 0, 0, 0)') ? box.bgColor : box.borderColor;
      }

      // Capture annotated screenshot before hiding
      const visibleShot = await send(sessionId, 'Page.captureScreenshot', { format: 'png' });
      const visibleViewportFile = path.join(tmpDir, `vis_${elemDef.id}_${targetTheme}.png`);
      fs.writeFileSync(visibleViewportFile, Buffer.from(visibleShot.data, 'base64'));

      const annotatedPath = path.join(outDir, `option1-candidate-a-${targetTheme}-${elemDef.id}-annotated.png`);
      const cropVisiblePath = path.join(outDir, `option1-candidate-a-${targetTheme}-${elemDef.id}-visible.png`);
      execSync(`python scripts/crop_and_analyze.py "${visibleViewportFile}" ${box.x} ${box.y} ${box.w} ${box.h} ${fgLum} "${cropVisiblePath}" "${annotatedPath}"`);

      // Hide element (opacity: 0)
      await send(sessionId, 'Runtime.evaluate', {
        expression: `
          (() => {
            const card = document.getElementById("candidate-a");
            let el = null;
            if ("${elemDef.id}" === "headline") el = card.querySelector("h1");
            else if ("${elemDef.id}" === "subtext") el = card.querySelector("p");
            else if ("${elemDef.id}".includes("primary-cta")) el = card.querySelector('a[href="/builder/demo"]');
            else if ("${elemDef.id}".includes("secondary-cta")) el = card.querySelector('a[href="/templates"]');
            if (el) el.style.opacity = "0";
          })()
        `,
      });
      await sleep(200);

      // Sample 8 frames over 4s
      let highestPeakLum = -1;
      let lowestMinLum = 2;
      let bestAnalysis = null;
      let bestFrameBuf = null;
      const frameMeans = [];

      for (let f = 0; f < 8; f++) {
        const bgShot = await send(sessionId, 'Page.captureScreenshot', { format: 'png' });
        const buf = Buffer.from(bgShot.data, 'base64');
        const tmpBgFile = path.join(tmpDir, `bg_${elemDef.id}_${targetTheme}_${f}.png`);
        fs.writeFileSync(tmpBgFile, buf);

        const pyJson = execSync(
          `python scripts/crop_and_analyze.py "${tmpBgFile}" ${box.x} ${box.y} ${box.w} ${box.h} ${fgLum}`,
          { encoding: 'utf8' }
        ).trim();

        const analysis = JSON.parse(pyJson);
        frameMeans.push(analysis.meanLum);

        if (analysis.peakLum > highestPeakLum) {
          highestPeakLum = analysis.peakLum;
          bestAnalysis = analysis;
          bestFrameBuf = buf;
        }
        if (analysis.lowestLum < lowestMinLum) {
          lowestMinLum = analysis.lowestLum;
        }

        if (f < 7) await sleep(500);
      }

      // Save brightest frame crop
      const bestCropPath = path.join(outDir, `option1-candidate-a-${targetTheme}-${elemDef.id}-bg.png`);
      const bestViewportPath = path.join(tmpDir, `best_viewport_${elemDef.id}_${targetTheme}.png`);
      fs.writeFileSync(bestViewportPath, bestFrameBuf);
      execSync(`python scripts/crop_and_analyze.py "${bestViewportPath}" ${box.x} ${box.y} ${box.w} ${box.h} ${fgLum} "${bestCropPath}"`);

      // Restore element opacity
      await send(sessionId, 'Runtime.evaluate', {
        expression: `
          (() => {
            const card = document.getElementById("candidate-a");
            let el = null;
            if ("${elemDef.id}" === "headline") el = card.querySelector("h1");
            else if ("${elemDef.id}" === "subtext") el = card.querySelector("p");
            else if ("${elemDef.id}".includes("primary-cta")) el = card.querySelector('a[href="/builder/demo"]');
            else if ("${elemDef.id}".includes("secondary-cta")) el = card.querySelector('a[href="/templates"]');
            if (el) el.style.opacity = "1";
          })()
        `,
      });

      // Calculate WCAG contrast
      const contrastAtBrightestBg = getContrast(highestPeakLum, fgLum);
      const avgBgLum = frameMeans.reduce((a, b) => a + b, 0) / frameMeans.length;
      const contrastAtAvg = getContrast(avgBgLum, fgLum);

      allMeasurements.push({
        element: elemDef.name,
        theme: targetTheme,
        type: elemDef.type,
        requiredRatio: elemDef.requiredRatio,
        fgColor: fgColorDesc,
        peakBgRgb: `rgb(${bestAnalysis.peakRgb.join(', ')})`,
        peakBgLum: Number(highestPeakLum.toFixed(4)),
        contrastRatio: Number(contrastAtBrightestBg.toFixed(2)),
        contrastAtAvg: Number(contrastAtAvg.toFixed(2)),
        pass: contrastAtBrightestBg >= elemDef.requiredRatio,
        annotatedScreenshot: `public/recordings/contrast-audit/option1/option1-candidate-a-${targetTheme}-${elemDef.id}-annotated.png`,
        bgCropScreenshot: `public/recordings/contrast-audit/option1/option1-candidate-a-${targetTheme}-${elemDef.id}-bg.png`,
      });

      console.log(`  Brightest BG: rgb(${bestAnalysis.peakRgb.join(', ')}) (Lum: ${highestPeakLum.toFixed(4)})`);
      console.log(`  FG Lum: ${fgLum.toFixed(4)}`);
      console.log(`  Contrast Ratio @ Peak BG: ${contrastAtBrightestBg.toFixed(2)}:1 [${contrastAtBrightestBg >= elemDef.requiredRatio ? 'PASS' : 'FAIL'} (needs >= ${elemDef.requiredRatio}:1)]`);
    }
  }

  ws.close();
  chromeProc.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  console.log('\n========================================================================================');
  console.log('FINAL OPTION 1 (FIXED CANDIDATE A) FULL HERO CONTRAST AUDIT');
  console.log('========================================================================================');
  console.table(allMeasurements);

  fs.writeFileSync('scripts/option1-contrast-results.json', JSON.stringify(allMeasurements, null, 2));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
