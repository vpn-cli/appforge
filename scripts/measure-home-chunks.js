const fs = require('fs');
const zlib = require('zlib');

const html = fs.readFileSync('.next/server/app/index.html', 'utf8');
const regex = /src="([^"]+)"/g;
let m;
const scripts = [];
while ((m = regex.exec(html)) !== null) {
  if (m[1].startsWith('/_next/static/')) scripts.push(m[1]);
}

console.log('Total static scripts on / (Root Landing Page):', scripts.length);
let totalRaw = 0, totalGz = 0;
let shaderRaw = 0, shaderGz = 0;

for (const s of scripts) {
  const rel = s.replace('/_next/', '.next/');
  try {
    const buf = fs.readFileSync(rel);
    const gz = zlib.gzipSync(buf).length;
    totalRaw += buf.length;
    totalGz += gz;
    const str = buf.toString('utf8');
    const isShader = str.includes('@paper-design/shaders') || str.includes('HeroMeshBackground');
    if (isShader) {
      shaderRaw += buf.length;
      shaderGz += gz;
      console.log('Shader chunk:', s, '| Raw:', (buf.length / 1024).toFixed(1), 'KB | Gzip:', (gz / 1024).toFixed(1), 'KB');
    }
  } catch (e) {
    console.error('Error reading script:', e.message);
  }
}

console.log('--------------------------------------------------');
console.log('Total Root Route JS: Raw =', (totalRaw / 1024).toFixed(1), 'KB | Gzip =', (totalGz / 1024).toFixed(1), 'KB');
console.log('MeshGradient Component JS: Raw =', (shaderRaw / 1024).toFixed(1), 'KB | Gzip =', (shaderGz / 1024).toFixed(1), 'KB');
