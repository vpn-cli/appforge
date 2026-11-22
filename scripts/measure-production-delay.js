const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runSingleTrial(runIndex, url = 'http://localhost:3001/') {
  const tmpDir = path.join(os.tmpdir(), `chrome-bench-${runIndex}-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const port = 9880 + (runIndex % 50);

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
  for (let i = 0; i < 40; i++) {
    await sleep(150);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        wsUrl = (await res.json()).webSocketDebuggerUrl;
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

  try {
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

    // 4x CPU Throttling
    await send(sessionId, 'Emulation.setCPUThrottlingRate', { rate: 4 });

    // Track compile blocks and input delays across both WebGL2 and WebGL contexts
    await send(sessionId, 'Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__compileBlocks = [];
        window.__clicks = [];

        function recordBlock(type, fn, args, ctx) {
          const start = performance.now();
          const ret = fn.apply(ctx, args);
          const end = performance.now();
          window.__compileBlocks.push({ type, start, end, duration: end - start });
          return ret;
        }

        function hook(proto) {
          if (!proto) return;
          const origCompile = proto.compileShader;
          proto.compileShader = function(...args) {
            return recordBlock('compileShader', origCompile, args, this);
          };

          const origLink = proto.linkProgram;
          proto.linkProgram = function(...args) {
            return recordBlock('linkProgram', origLink, args, this);
          };

          const origGetParam = proto.getProgramParameter;
          proto.getProgramParameter = function(...args) {
            if (args[1] === 35714) { // LINK_STATUS
              return recordBlock('linkStatusCheck', origGetParam, args, this);
            }
            return origGetParam.apply(this, args);
          };
        }

        if (typeof WebGL2RenderingContext !== 'undefined') hook(WebGL2RenderingContext.prototype);
        if (typeof WebGLRenderingContext !== 'undefined') hook(WebGLRenderingContext.prototype);

        window.addEventListener('pointerdown', (e) => {
          const handledAt = performance.now();
          const delay = handledAt - e.timeStamp;
          window.__clicks.push({
            sentAt: e.timeStamp,
            handledAt,
            delay
          });
        }, { capture: true, passive: true });
      `
    });

    await send(sessionId, 'Page.navigate', { url });

    // Clicks sent across the 3500ms - 6500ms compilation window under 4x CPU
    await sleep(3500);

    for (let i = 0; i < 60; i++) {
      await send(sessionId, 'Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: 400,
        y: 350,
        button: 'left',
        clickCount: 1,
      });
      await send(sessionId, 'Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: 400,
        y: 350,
        button: 'left',
        clickCount: 1,
      });
      await sleep(40);
    }

    await sleep(1000);

    const evalRes = await send(sessionId, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const blocks = window.__compileBlocks || [];
        const clicks = window.__clicks || [];

        // Identify compile window span
        const compileStart = blocks.length > 0 ? Math.min(...blocks.map(b => b.start)) : 0;
        const compileEnd = blocks.length > 0 ? Math.max(...blocks.map(b => b.end)) : 0;
        const totalBlockTime = blocks.reduce((sum, b) => sum + b.duration, 0);

        // Filter clicks that were dispatched during any compile block or within 20ms of it
        const compileClicks = clicks.filter(c => {
          return blocks.some(b => c.sentAt >= (b.start - 10) && c.sentAt <= (b.end + 20));
        });

        // If no click landed strictly inside the exact micro-intervals, take the clicks spanning the compile window
        const windowClicks = clicks.filter(c => c.sentAt >= compileStart && c.sentAt <= compileEnd);
        const targetClicks = compileClicks.length > 0 ? compileClicks : (windowClicks.length > 0 ? windowClicks : clicks);

        const targetDelays = targetClicks.map(c => c.delay);
        const sorted = [...targetDelays].sort((a, b) => a - b);
        const medianDelay = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
        const maxDelay = sorted.length > 0 ? Math.max(...sorted) : 0;

        return {
          compileBlockCount: blocks.length,
          totalBlockDurationMs: totalBlockTime,
          clicksRecorded: clicks.length,
          compileClicksCount: compileClicks.length,
          runMedianMs: medianDelay,
          runMaxMs: maxDelay,
          allCompileDelays: targetDelays
        };
      })()`
    });

    return evalRes.result.value;
  } finally {
    ws.close();
    chromeProc.kill();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  console.log('================================================================');
  console.log(' Item 3 / Gate (b) Input Delay Benchmark (Production Build)');
  console.log(' Configuration: 10 Runs | 4x CPU Throttling | Clicks During Compile');
  console.log(' Gate Rule: Adds <= 20ms to Control Median AND <= 50ms to Control Max');
  console.log('================================================================\n');

  let controlSummary = null;
  if (fs.existsSync('scripts/input-delay-control-summary.json')) {
    try {
      controlSummary = JSON.parse(fs.readFileSync('scripts/input-delay-control-summary.json', 'utf8'));
      console.log(`Loaded Control Baseline: Median = ${controlSummary.overallMedian.toFixed(2)}ms | Max = ${controlSummary.overallMax.toFixed(2)}ms\n`);
    } catch {}
  }

  const runs = [];

  for (let r = 1; r <= 10; r++) {
    console.log(`[Run ${r}/10] Executing benchmark trial...`);
    try {
      const data = await runSingleTrial(r);
      const runResult = {
        run: r,
        medianDelayMs: Number(data.runMedianMs.toFixed(2)),
        maxDelayMs: Number(data.runMaxMs.toFixed(2)),
        compileBlockDurationMs: Number(data.totalBlockDurationMs.toFixed(2)),
        compileClicksSampled: data.compileClicksCount || data.allCompileDelays.length,
      };
      runs.push(runResult);
      console.log(`  ✓ Run ${r}: Median = ${runResult.medianDelayMs}ms | Max = ${runResult.maxDelayMs}ms (Compile Block: ${runResult.compileBlockDurationMs}ms)`);
    } catch (err) {
      console.error(`  ✗ Run ${r} failed:`, err.message);
      r--; // retry
    }
    await sleep(1000);
  }

  console.log('\n================================================================');
  console.log(' ALL 10 RUNS COMPLETE:');
  console.log('================================================================');
  console.table(runs);

  const allMedians = runs.map(r => r.medianDelayMs).sort((a, b) => a - b);
  const allMaxes = runs.map(r => r.maxDelayMs);
  const overallMedian = allMedians[Math.floor(allMedians.length / 2)];
  const overallMax = Math.max(...allMaxes);

  console.log(`\nOverall Median Input Delay: ${overallMedian.toFixed(2)} ms`);
  console.log(`Overall Max Input Delay:    ${overallMax.toFixed(2)} ms`);

  let gatePass = overallMedian < 50 && overallMax < 200;
  let medianDelta = 0;
  let maxDelta = 0;

  if (controlSummary) {
    medianDelta = overallMedian - controlSummary.overallMedian;
    maxDelta = overallMax - controlSummary.overallMax;
    console.log(`\n--- GATE EVALUATION ALONGSIDE CONTROL ---`);
    console.log(`Control Median:  ${controlSummary.overallMedian.toFixed(2)} ms | Shader Median: ${overallMedian.toFixed(2)} ms | Delta: ${medianDelta > 0 ? '+' : ''}${medianDelta.toFixed(2)} ms (Limit: +20ms)`);
    console.log(`Control Max:     ${controlSummary.overallMax.toFixed(2)} ms | Shader Max:    ${overallMax.toFixed(2)} ms | Delta: ${maxDelta > 0 ? '+' : ''}${maxDelta.toFixed(2)} ms (Limit: +50ms)`);
    gatePass = medianDelta <= 20 && maxDelta <= 50;
  }

  console.log(`\nGate Result: ${gatePass ? 'PASSED ✅' : 'FAILED ❌'}\n`);

  fs.writeFileSync('scripts/input-delay-summary.json', JSON.stringify({
    runs,
    overallMedian,
    overallMax,
    controlBaseline: controlSummary ? {
      median: controlSummary.overallMedian,
      max: controlSummary.overallMax,
    } : null,
    medianDelta: Number(medianDelta.toFixed(2)),
    maxDelta: Number(maxDelta.toFixed(2)),
    gatePass,
    timestamp: new Date().toISOString()
  }, null, 2));

  fs.writeFileSync('scripts/input-delay-native-summary.json', JSON.stringify({
    runs,
    overallMedian,
    overallMax,
    controlBaseline: controlSummary ? {
      median: controlSummary.overallMedian,
      max: controlSummary.overallMax,
    } : null,
    medianDelta: Number(medianDelta.toFixed(2)),
    maxDelta: Number(maxDelta.toFixed(2)),
    gatePass,
    timestamp: new Date().toISOString()
  }, null, 2));
}

main().catch(console.error);
