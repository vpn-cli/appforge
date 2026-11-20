const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const url = 'http://localhost:3001';
const runs = [];

for (let i = 1; i <= 3; i++) {
  const outPath = `scripts/lh-option1-run${i}.json`;
  const tmpDir = path.join(os.tmpdir(), `chrome-lh-opt1-${i}-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log(`Starting Lighthouse Option 1 (MeshGradient) Run ${i}/3...`);
  try {
    execSync(
      `npx lighthouse ${url} --chrome-flags="--headless=new --no-sandbox --user-data-dir=${tmpDir}" --form-factor=mobile --screenEmulation.mobile=true --throttling-method=simulate --only-categories=performance --output=json --output-path=${outPath} --quiet`,
      { stdio: 'inherit' }
    );
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }

  const report = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const perf = Math.round(report.categories.performance.score * 100);
  const fcp = report.audits['first-contentful-paint'].displayValue;
  const fcpMs = Math.round(report.audits['first-contentful-paint'].numericValue);
  const lcp = report.audits['largest-contentful-paint'].displayValue;
  const lcpMs = Math.round(report.audits['largest-contentful-paint'].numericValue);
  const tbt = report.audits['total-blocking-time'].displayValue;
  const tbtMs = Math.round(report.audits['total-blocking-time'].numericValue);
  const cls = report.audits['cumulative-layout-shift'].displayValue;
  const clsVal = Number(report.audits['cumulative-layout-shift'].numericValue.toFixed(4));
  const si = report.audits['speed-index'].displayValue;
  const siMs = Math.round(report.audits['speed-index'].numericValue);

  runs.push({
    run: i,
    perf,
    fcp,
    fcpMs,
    lcp,
    lcpMs,
    tbt,
    tbtMs,
    cls,
    clsVal,
    si,
    siMs,
  });
}

console.log('\n=== OPTION 1 (FIXED MESHGRADIENT) LIGHTHOUSE RESULTS ===');
console.table(runs);

// Compute median by performance score (or LCP)
const sorted = [...runs].sort((a, b) => a.perf - b.perf);
const median = sorted[1];
console.log('\nMEDIAN RUN (OPTION 1):', median);
fs.writeFileSync('scripts/lh-option1-summary.json', JSON.stringify({ runs, median }, null, 2));
