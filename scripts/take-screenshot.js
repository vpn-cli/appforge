const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const url = process.argv[2] || 'http://localhost:3000/builder/demo?direction=A&theme=dark';
const outFile = process.argv[3] || 'D:\\Projects\\appforge\\.screenshots\\direction-a-dark.png';
const tmpDir = path.join(os.tmpdir(), 'chrome-prof-' + Date.now());

fs.mkdirSync(tmpDir, { recursive: true });

console.log('Running Chrome for:', url, '->', outFile);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--user-data-dir=' + tmpDir,
  '--window-size=1440,900',
  '--screenshot=' + outFile,
  url
];

const proc = spawn(chromePath, args);

proc.stdout.on('data', d => console.log('stdout:', d.toString()));
proc.stderr.on('data', d => console.log('stderr:', d.toString()));

proc.on('close', code => {
  console.log('Process exited with code:', code);
  console.log('File exists?', fs.existsSync(outFile));
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});
