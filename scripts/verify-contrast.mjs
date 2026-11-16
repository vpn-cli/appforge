// Comprehensive WCAG 2.2 AA Contrast Verification Script for AppForge
function sRGBtoLin(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16)
  ];
}

function oklchToRgb(l, c, h) {
  const hr = (h || 0) * Math.PI / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l_cube = l_ * l_ * l_;
  const m_cube = m_ * m_ * m_;
  const s_cube = s_ * s_ * s_;

  const r_lin = +4.0767434770 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  const g_lin = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  const b_lin = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

  function toSrgb(c_lin) {
    const cl = Math.max(0, Math.min(1, c_lin));
    return cl <= 0.0031308 ? 12.92 * cl : 1.055 * Math.pow(cl, 1/2.4) - 0.055;
  }

  return [Math.round(toSrgb(r_lin) * 255), Math.round(toSrgb(g_lin) * 255), Math.round(toSrgb(b_lin) * 255)];
}

function luminance(rgb) {
  return 0.2126 * sRGBtoLin(rgb[0]) + 0.7152 * sRGBtoLin(rgb[1]) + 0.0722 * sRGBtoLin(rgb[2]);
}

function getContrast(rgb1, rgb2) {
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Light theme tokens
const lightBg = oklchToRgb(0.985, 0, 0); // #fafafa
const lightCard = [255, 255, 255];
const lightMuted = oklchToRgb(0.97, 0, 0); // #f4f4f5
const lightFg = oklchToRgb(0.145, 0, 0); // #18181b
const lightMutedFg = oklchToRgb(0.45, 0, 0); // #6b6b70
const brandLight = hexToRgb('#6D28D9'); // Violet 700

const lightTokens = [
  { name: 'Foreground on Background', fg: lightFg, bg: lightBg, min: 4.5 },
  { name: 'Foreground on Card', fg: lightFg, bg: lightCard, min: 4.5 },
  { name: 'Muted-Foreground on Background', fg: lightMutedFg, bg: lightBg, min: 4.5 },
  { name: 'Muted-Foreground on Muted Bg', fg: lightMutedFg, bg: lightMuted, min: 4.5 },
  { name: 'Brand (#6D28D9) on Background', fg: brandLight, bg: lightBg, min: 4.5 },
  { name: 'Brand (#6D28D9) on Card', fg: brandLight, bg: lightCard, min: 4.5 },
  { name: 'Error Text (#8C2E44) on Card', fg: hexToRgb('#8C2E44'), bg: lightCard, min: 4.5 },
  { name: 'Error Text (#8C2E44) on Error Light (#FBEAEE)', fg: hexToRgb('#8C2E44'), bg: hexToRgb('#FBEAEE'), min: 4.5 },
  { name: 'Warning Text (#784A15) on Card', fg: hexToRgb('#784A15'), bg: lightCard, min: 4.5 },
  { name: 'Warning Text (#784A15) on Warning Light (#FDF1E7)', fg: hexToRgb('#784A15'), bg: hexToRgb('#FDF1E7'), min: 4.5 },
  { name: 'Success Text (#2F7A55) on Card', fg: hexToRgb('#2F7A55'), bg: lightCard, min: 4.5 },
  { name: 'Success Text (#2F7A55) on Success Light (#EAF7F0)', fg: hexToRgb('#2F7A55'), bg: hexToRgb('#EAF7F0'), min: 4.5 },
];

// Dark theme tokens
const darkBg = oklchToRgb(0.145, 0, 0); // #18181b
const darkCard = oklchToRgb(0.205, 0, 0); // #27272a
const darkMuted = oklchToRgb(0.269, 0, 0); // #3f3f46
const darkFg = [255, 255, 255];
const darkMutedFg = oklchToRgb(0.708, 0, 0); // #a1a1aa
const brandDarkText = hexToRgb('#A78BFA'); // Violet 400 for text/focus on dark

const darkTokens = [
  { name: 'Foreground on Background', fg: darkFg, bg: darkBg, min: 4.5 },
  { name: 'Foreground on Card', fg: darkFg, bg: darkCard, min: 4.5 },
  { name: 'Muted-Foreground on Background', fg: darkMutedFg, bg: darkBg, min: 4.5 },
  { name: 'Muted-Foreground on Muted Bg', fg: darkMutedFg, bg: darkMuted, min: 4.5 },
  { name: 'Brand Text (#A78BFA) on Background', fg: brandDarkText, bg: darkBg, min: 4.5 },
  { name: 'Brand Text (#A78BFA) on Card', fg: brandDarkText, bg: darkCard, min: 4.5 },
  { name: 'Error Text (#F472B6) on Card', fg: hexToRgb('#F472B6'), bg: darkCard, min: 4.5 },
  { name: 'Error Text (#F472B6) on Error Light (#2E1119)', fg: hexToRgb('#F472B6'), bg: hexToRgb('#2E1119'), min: 4.5 },
  { name: 'Warning Text (#FBBF24) on Card', fg: hexToRgb('#FBBF24'), bg: darkCard, min: 4.5 },
  { name: 'Warning Text (#FBBF24) on Warning Light (#2D1E0A)', fg: hexToRgb('#FBBF24'), bg: hexToRgb('#2D1E0A'), min: 4.5 },
  { name: 'Success Text (#34D399) on Card', fg: hexToRgb('#34D399'), bg: darkCard, min: 4.5 },
  { name: 'Success Text (#34D399) on Success Light (#0B281A)', fg: hexToRgb('#34D399'), bg: hexToRgb('#0B281A'), min: 4.5 },
];

console.log('=== LIGHT THEME WCAG 2.2 AA VERIFICATION ===');
let lightPass = true;
lightTokens.forEach(t => {
  const ratio = getContrast(t.fg, t.bg);
  const pass = ratio >= t.min;
  if (!pass) lightPass = false;
  console.log(`${t.name.padEnd(55)}: ${ratio.toFixed(2).padStart(5)}:1  ${pass ? '✅ PASS' : '❌ FAIL'}`);
});

console.log('\n=== DARK THEME WCAG 2.2 AA VERIFICATION ===');
let darkPass = true;
darkTokens.forEach(t => {
  const ratio = getContrast(t.fg, t.bg);
  const pass = ratio >= t.min;
  if (!pass) darkPass = false;
  console.log(`${t.name.padEnd(55)}: ${ratio.toFixed(2).padStart(5)}:1  ${pass ? '✅ PASS' : '❌ FAIL'}`);
});

if (lightPass && darkPass) {
  console.log('\n>>> ALL TOKENS MEET OR EXCEED WCAG 2.2 AA (>= 4.5:1) IN BOTH LIGHT AND DARK MODES <<<');
} else {
  console.log('\n>>> SOME TOKENS FAILED CONTRAST CHECKS <<<');
  process.exit(1);
}

