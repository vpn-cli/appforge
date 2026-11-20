const fs = require('fs');
const zlib = require('zlib');

const html = fs.readFileSync('.next/server/app/index.html', 'utf8');
const regex = /src="([^"]+)"/g;
let m;
const scripts = [];
while ((m = regex.exec(html)) !== null) {
  if (m[1].startsWith('/_next/static/')) scripts.push(m[1]);
}

console.log('Total static scripts on / with Option 2:', scripts.length);
let totalRaw = 0, totalGz = 0;
let candidateRaw = 0, candidateGz = 0;

for (const s of scripts) {
  const rel = s.replace('/_next/', '.next/');
  try {
    const buf = fs.readFileSync(rel);
    const gz = zlib.gzipSync(buf).length;
    totalRaw += buf.length;
    totalGz += gz;
    const str = buf.toString('utf8');
    if (str.includes('CandidateDVideo')) {
      candidateRaw += buf.length;
      candidateGz += gz;
      console.log('Candidate D chunk:', s, '| Raw:', (buf.length / 1024).toFixed(1), 'KB | Gzip:', (gz / 1024).toFixed(1), 'KB');
    }
  } catch (e) {
    console.error('Error reading script:', e.message);
  }
}

console.log('--------------------------------------------------');
console.log('Total Root Route JS: Raw =', (totalRaw / 1024).toFixed(1), 'KB | Gzip =', (totalGz / 1024).toFixed(1), 'KB');
console.log('Candidate D Component JS: Raw =', (candidateRaw / 1024).toFixed(1), 'KB | Gzip =', (candidateGz / 1024).toFixed(1), 'KB');
