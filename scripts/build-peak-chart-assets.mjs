import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const CW = 540;
const CH = 696;
const CR = 56;
const HN = CH / CW;
const RN = CR / CW;
const BX = 0.32 * CW;
const BY = 0.16 * CW;
const GRAIN = 1.7;
const BREATH_GAIN = 0.42;

const FIELD_FILL = "#1678ff";
const FIELD_SHADES = [
  { shape: [0.4748, 0.8152, 0.7509, 0.8801, 0.7026], color: "#000000", opacity: 1.0 },
  { shape: [0.3741, 0.2723, 0.7371, 0.3009, 0.1168], color: "#020000", opacity: 1.0 },
  { shape: [0.7846, 0.0251, 0.3833, 0.1301, -0.5566], color: "#2e85ff", opacity: 0.4756 },
  { shape: [0.6206, -0.2018, 0.1282, 0.5909, 0.2754], color: "#3584ff", opacity: 0.3146 },
  { shape: [0.6, 1.2391, 0.827, 0.2111, -1.6357], color: "#000d1e", opacity: 1.0 },
  { shape: [0.0964, 0.5388, 1000.0, 0.1285, 0.5421], color: "#000005", opacity: 0.2298 },
];
const FIELD_RIMS = [
  { shape: [0.1207, -0.0365, 0.0492], color: "#2667ff", opacity: 1.0 },
  { shape: [0.0667, -0.0166, 0.0176], color: "#467dff", opacity: 1.0 },
  { shape: [0.037, -0.0134, 0.0154], color: "#c2ffff", opacity: 0.8091 },
];
const HALO = { cx: 0.4996, cy: 0.6438, sx: 0.2498, sy: 0.2433, opacity: 0.845, color: "#0e50ff" };
const GRID_DX = 40.64;
const GRID_DY = 40.07;
const GRID_Y0 = 468.7;
const GRID_COLOR = "#5a87e1";
const GRID_ALPHA = 0.23;

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function smooth(x) { const t = clamp01(x); return t * t * (3 - 2 * t); }
function erf(x) {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
function phi(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
function sdf(u, v) {
  const qx = Math.abs(u - 0.5) - (0.5 - RN);
  const qy = Math.abs(v - HN / 2) - (HN / 2 - RN);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - RN;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rgbOf(color) {
  const hex = /^#([0-9a-f]{6}|[0-9a-f]{3})/i.exec(color.trim());
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map(d => d + d).join('') : hex[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return [0, 0, 0];
}

async function main() {
  const outDir = path.resolve('public/peak-chart');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const w = 1080;
  const h = Math.round(1080 * HN); // 1392
  console.log(`Generating Peak Chart precomputed assets at 2x resolution: ${w}x${h}...`);

  // 1 & 2. Field rest and lift layers
  console.log('Computing glow fields (rest and lift)...');
  const d1 = new Uint8ClampedArray(w * h * 4);
  const d2 = new Uint8ClampedArray(w * h * 4);
  const rand = rng(11);
  const fill = rgbOf(FIELD_FILL);
  const shades = FIELD_SHADES.map(({ shape: [cx, cy, sx, sy, th], color, opacity }) => ({
    cx, cy,
    isx: 1 / Math.abs(sx),
    isy: 1 / Math.abs(sy),
    c: Math.cos(th),
    s: Math.sin(th),
    rgb: rgbOf(color),
    a: opacity,
  }));
  const rims = FIELD_RIMS.map(({ shape: [off, sp, sg], color, opacity }) => ({
    off, sp, sg,
    rgb: rgbOf(color),
    a: opacity,
  }));
  const k2 = 1 + BREATH_GAIN;

  for (let j = 0; j < h; j++) {
    const v = (j + 0.5) / w;
    for (let i = 0; i < w; i++) {
      const u = (i + 0.5) / w;
      let r = fill[0], g = fill[1], b = fill[2];
      for (const o of shades) {
        const du = u - o.cx, dv = v - o.cy;
        const x = (o.c * du + o.s * dv) * o.isx;
        const y = (-o.s * du + o.c * dv) * o.isy;
        const m = o.a * Math.exp(-0.5 * (x * x + y * y));
        r += m * (o.rgb[0] - r);
        g += m * (o.rgb[1] - g);
        b += m * (o.rgb[2] - b);
      }
      let r2 = r, g2 = g, b2 = b;
      for (const o of rims) {
        const vs = v + o.off;
        const dx = Math.min(u, 1 - u), dy = Math.min(vs, HN - vs);
        const ratio = Math.min(1, phi((-sdf(u, vs) - o.sp) / o.sg) / Math.max(1e-9, phi((Math.min(dx, dy) - o.sp) / o.sg)));
        const k = 1 - phi((dx - o.sp) / o.sg) * phi((dy - o.sp) / o.sg) * ratio;
        const m = o.a * k;
        r += m * (o.rgb[0] - r);
        g += m * (o.rgb[1] - g);
        b += m * (o.rgb[2] - b);
        const m2 = Math.min(1, m * k2);
        r2 += m2 * (o.rgb[0] - r2);
        g2 += m2 * (o.rgb[1] - g2);
        b2 += m2 * (o.rgb[2] - b2);
      }
      const n = (rand() + rand() + rand() - 1.5) * 2 * GRAIN;
      const p = (j * w + i) * 4;
      d1[p] = r + n; d1[p + 1] = g + n; d1[p + 2] = b + n; d1[p + 3] = 255;
      d2[p] = r2 + n; d2[p + 1] = g2 + n; d2[p + 2] = b2 + n; d2[p + 3] = 255;
    }
  }

  console.log('Writing field-rest.webp and field-lift.webp...');
  await sharp(Buffer.from(d1.buffer), { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(outDir, 'field-rest.webp'));

  await sharp(Buffer.from(d2.buffer), { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(outDir, 'field-lift.webp'));

  // 3. Halo (at 2x card halo size)
  const hw = Math.round((CW + 2 * BX) * 2); // 1771
  const hh = Math.round((CH + 2 * BY) * 2); // 1738
  console.log(`Computing halo (${hw}x${hh})...`);
  const hi = new Uint8ClampedArray(hw * hh * 4);
  const [hr, hg, hb] = rgbOf(HALO.color);
  for (let j = 0; j < hh; j++) {
    const v = (((j + 0.5) / hh) * (CH + 2 * BY) - BY) / CW;
    for (let i = 0; i < hw; i++) {
      const u = (((i + 0.5) / hw) * (CW + 2 * BX) - BX) / CW;
      const a = (u - HALO.cx) / HALO.sx, e = (v - HALO.cy) / HALO.sy;
      const k = Math.exp(-0.5 * (a * a + e * e)) * HALO.opacity;
      const p = (j * hw + i) * 4;
      hi[p] = hr; hi[p + 1] = hg; hi[p + 2] = hb; hi[p + 3] = Math.min(255, Math.round(k * 255));
    }
  }
  console.log('Writing halo.webp...');
  await sharp(Buffer.from(hi.buffer), { raw: { width: hw, height: hh, channels: 4 } })
    .webp({ quality: 90, effort: 6 })
    .toFile(path.join(outDir, 'halo.webp'));

  // 4. Grid
  console.log(`Computing grid (${w}x${h})...`);
  const gi = new Uint8ClampedArray(w * h * 4);
  const [gr, gg, gb] = rgbOf(GRID_COLOR);
  const s = w / CW;

  const vLineXs = new Set();
  for (let k = -6; k <= 6; k++) {
    const x = Math.round((CW / 2 + GRID_DX * k) * s);
    vLineXs.add(x);
  }

  const hLineYs = new Set();
  for (let k = -6; k <= 6; k++) {
    const y = GRID_Y0 + GRID_DY * k;
    if (y < 250 || y > CH) continue;
    hLineYs.add(Math.round(y * s));
  }

  const minY = Math.round(250 * s);
  const maxY = Math.round(CH * s);

  for (let j = 0; j < h; j++) {
    const cardY = (j + 0.5) / s;
    const my = smooth((cardY - 350) / 230);
    const isH = hLineYs.has(j);

    for (let i = 0; i < w; i++) {
      const cardX = (i + 0.5) / s;
      const isV = vLineXs.has(i) && j >= minY && j <= maxY;

      if (isH || isV) {
        const mx = Math.exp(-0.5 * Math.pow((cardX - CW / 2) / 92, 2));
        const alpha = Math.min(255, Math.round(255 * GRID_ALPHA * mx * my));
        const p = (j * w + i) * 4;
        gi[p] = gr; gi[p + 1] = gg; gi[p + 2] = gb; gi[p + 3] = alpha;
      }
    }
  }
  console.log('Writing grid.webp...');
  await sharp(Buffer.from(gi.buffer), { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 90, effort: 6 })
    .toFile(path.join(outDir, 'grid.webp'));

  console.log('\n=== ASSET SUMMARY ===');
  const files = ['field-rest.webp', 'field-lift.webp', 'halo.webp', 'grid.webp'];
  const summary = files.map((f) => {
    const p = path.join(outDir, f);
    const sz = fs.statSync(p).size;
    return { file: f, path: `public/peak-chart/${f}`, sizeBytes: sz, sizeKb: (sz / 1024).toFixed(2) + ' KB' };
  });
  console.table(summary);
}

main().catch(console.error);
