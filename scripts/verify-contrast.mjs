import fs from 'node:fs';
import path from 'node:path';

// Pure JS OKLCH to sRGB converter (Zero external dependencies)
function oklchToRgb(l, c, h, alpha = 1) {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const lLin = l_ * l_ * l_;
  const mLin = m_ * m_ * m_;
  const sLin = s_ * s_ * s_;

  let rLin = +4.0767434036 * lLin - 3.3077115913 * mLin + 0.2309699292 * sLin;
  let gLin = -1.2684380046 * lLin + 2.6097574011 * mLin - 0.3413193965 * sLin;
  let bLin = -0.0041960863 * lLin - 0.7034186147 * mLin + 1.7076147010 * sLin;

  const toGamma = (x) => {
    x = Math.max(0, Math.min(1, x));
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  return [
    Math.round(toGamma(rLin) * 255),
    Math.round(toGamma(gLin) * 255),
    Math.round(toGamma(gLin) * 255),
    alpha
  ];
}

function parseCssColor(rawVal) {
  let val = rawVal.trim().split('/*')[0].trim();
  if (val.startsWith('#')) {
    val = val.replace('#', '');
    if (val.length === 3) val = val.split('').map(x => x + x).join('');
    return [
      parseInt(val.slice(0, 2), 16),
      parseInt(val.slice(2, 4), 16),
      parseInt(val.slice(4, 6), 16),
      1
    ];
  }
  const oklchMatch = val.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i);
  if (oklchMatch) {
    const l = parseFloat(oklchMatch[1]);
    const c = parseFloat(oklchMatch[2]);
    const h = parseFloat(oklchMatch[3]);
    let alpha = 1;
    if (oklchMatch[4]) {
      alpha = oklchMatch[4].endsWith('%') ? parseFloat(oklchMatch[4]) / 100 : parseFloat(oklchMatch[4]);
    }
    return oklchToRgb(l, c, h, alpha);
  }
  throw new Error(`Unsupported color format in globals.css: "${rawVal}"`);
}

function sRGBtoLin(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
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

// Read and parse app/globals.css directly
const cssPath = path.resolve('app/globals.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

function extractScope(content, selector) {
  const regex = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`, 'm');
  const match = content.match(regex);
  if (!match) throw new Error(`Scope ${selector} not found in globals.css`);
  const lines = match[1].split('\n');
  const tokens = {};
  for (const line of lines) {
    const clean = line.trim().split('/*')[0].trim();
    if (!clean.startsWith('--')) continue;
    const colonIdx = clean.indexOf(':');
    if (colonIdx === -1) continue;
    const key = clean.slice(0, colonIdx).trim();
    const val = clean.slice(colonIdx + 1).replace(';', '').trim();
    tokens[key] = val;
  }
  return tokens;
}

const rootTokens = extractScope(cssContent, ':root');
const darkTokens = extractScope(cssContent, '\\.dark');

console.log('Successfully parsed tokens directly from app/globals.css:');
console.log(`- :root: ${Object.keys(rootTokens).length} tokens`);
console.log(`- .dark: ${Object.keys(darkTokens).length} tokens`);

// Light Theme Values parsed dynamically
const lightBg = parseCssColor(rootTokens['--background']);
const lightCard = parseCssColor(rootTokens['--card']);
const lightFg = parseCssColor(rootTokens['--foreground']);
const lightMuted = parseCssColor(rootTokens['--muted']);
const lightMutedFg = parseCssColor(rootTokens['--muted-foreground']);
const lightInput = parseCssColor(rootTokens['--input']);
const lightBorderStrong = parseCssColor(rootTokens['--border-strong']);
const lightRing = parseCssColor(rootTokens['--ring']);
const lightAccent = parseCssColor(rootTokens['--accent']);
const lightPrimary = parseCssColor(rootTokens['--primary']);
const lightPrimaryFg = parseCssColor(rootTokens['--primary-foreground']);
const lightPrimaryHover = parseCssColor(rootTokens['--primary-hover']);

const lightSuccessText = parseCssColor(rootTokens['--theme-success-text']);
const lightSuccessPill = parseCssColor(rootTokens['--theme-success-light']);
const lightWarningText = parseCssColor(rootTokens['--theme-warning-text']);
const lightWarningPill = parseCssColor(rootTokens['--theme-warning-light']);
const lightErrorText = parseCssColor(rootTokens['--theme-error-text']);
const lightErrorPill = parseCssColor(rootTokens['--theme-error-light']);

// Dark Theme Values parsed dynamically
const darkBg = parseCssColor(darkTokens['--background']);
const darkCard = parseCssColor(darkTokens['--card']);
const darkFg = parseCssColor(darkTokens['--foreground']);
const darkMuted = parseCssColor(darkTokens['--muted']);
const darkMutedFg = parseCssColor(darkTokens['--muted-foreground']);
const darkInput = parseCssColor(darkTokens['--input']);
const darkBorderStrong = parseCssColor(darkTokens['--border-strong']);
const darkRing = parseCssColor(darkTokens['--ring']);
const darkAccent = parseCssColor(darkTokens['--accent']);
const darkPrimary = parseCssColor(darkTokens['--primary']);
const darkPrimaryFg = parseCssColor(darkTokens['--primary-foreground']);
const darkPrimaryHover = parseCssColor(darkTokens['--primary-hover']);

const darkSuccessText = parseCssColor(darkTokens['--theme-success-text']);
const darkSuccessPill = parseCssColor(darkTokens['--theme-success-light']);
const darkWarningText = parseCssColor(darkTokens['--theme-warning-text']);
const darkWarningPill = parseCssColor(darkTokens['--theme-warning-light']);
const darkErrorText = parseCssColor(darkTokens['--theme-error-text']);
const darkErrorPill = parseCssColor(darkTokens['--theme-error-light']);

const lightTests = [
  // Typography
  { category: 'Typography', name: 'Foreground (#111110) on Background (#FBFBFA)', fg: lightFg, bg: lightBg, min: 4.5 },
  { category: 'Typography', name: 'Foreground (#111110) on Card (#FFFFFF)', fg: lightFg, bg: lightCard, min: 4.5 },
  { category: 'Typography', name: 'Foreground (#111110) on Raised/Muted (#F4F4F2)', fg: lightFg, bg: lightMuted, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground (#63625C) on Background (#FBFBFA)', fg: lightMutedFg, bg: lightBg, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground (#63625C) on Card (#FFFFFF)', fg: lightMutedFg, bg: lightCard, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground (#63625C) on Raised (#F4F4F2)', fg: lightMutedFg, bg: lightMuted, min: 4.5 },

  // Header Org Name
  { category: 'Header Chrome', name: 'Header Org Name (Foreground) on Header Bg', fg: lightFg, bg: lightBg, min: 4.5 },
  { category: 'Header Chrome', name: 'Header Org Name (Foreground) on Raised Pill', fg: lightFg, bg: lightMuted, min: 4.5 },

  // Buttons
  { category: 'Buttons', name: 'Primary Button Label (#FFFFFF) on Primary (#111110)', fg: lightPrimaryFg, bg: lightPrimary, min: 4.5 },
  { category: 'Buttons', name: 'Primary Button Label (#FFFFFF) on Hover (#2A2A28)', fg: lightPrimaryFg, bg: lightPrimaryHover, min: 4.5 },
  { category: 'Buttons', name: 'Disabled Button Text (#63625C) on Raised (#F4F4F2)', fg: lightMutedFg, bg: lightMuted, min: 4.5 },

  // Semantic Badges / Status
  { category: 'Semantic', name: 'Success Text (#166534) on Success Tint (#ECFDF3)', fg: lightSuccessText, bg: lightSuccessPill, min: 4.5 },
  { category: 'Semantic', name: 'Warning Text (#B54708) on Warning Tint (#FFFAEB)', fg: lightWarningText, bg: lightWarningPill, min: 4.5 },
  { category: 'Semantic', name: 'Error Text (#B42318) on Error Tint (#FEF3F2)', fg: lightErrorText, bg: lightErrorPill, min: 4.5 },

  // Non-Text (3:1 minimum)
  { category: 'Non-Text', name: 'Focus Ring / Accent (#1D4ED8) vs Background', fg: lightRing, bg: lightBg, min: 3.0 },
  { category: 'Non-Text', name: 'Input Border Strong (#8F8E88) vs Background', fg: lightBorderStrong, bg: lightBg, min: 3.0 },

  // Monaco Editor Token Contrast (Light Theme on #FFFFFF)
  { category: 'Editor Light', name: 'Editor Foreground (#18181B) vs Editor Surface', fg: parseCssColor('#18181B'), bg: [255, 255, 255], min: 4.5 },
  { category: 'Editor Light', name: 'Editor Keys (#1D4ED8) vs Editor Surface', fg: parseCssColor('#1D4ED8'), bg: [255, 255, 255], min: 4.5 },
  { category: 'Editor Light', name: 'Editor Strings (#15803D) vs Editor Surface', fg: parseCssColor('#15803D'), bg: [255, 255, 255], min: 4.5 },
  { category: 'Editor Light', name: 'Editor Numbers (#A16207) vs Editor Surface', fg: parseCssColor('#A16207'), bg: [255, 255, 255], min: 4.5 },
  { category: 'Editor Light', name: 'Editor Keywords (#C2410C) vs Editor Surface', fg: parseCssColor('#C2410C'), bg: [255, 255, 255], min: 4.5 },
  { category: 'Editor Light', name: 'Editor Punctuation (#52525B) vs Editor Surface', fg: parseCssColor('#52525B'), bg: [255, 255, 255], min: 4.5 },
  { category: 'Editor Light', name: 'Editor Cursor (#111110) vs Editor Surface', fg: lightFg, bg: [255, 255, 255], min: 4.5 },
];

const darkTests = [
  // Typography
  { category: 'Typography', name: 'Foreground (#EDEDEA) on Background (#0F0F0E)', fg: darkFg, bg: darkBg, min: 4.5 },
  { category: 'Typography', name: 'Foreground (#EDEDEA) on Card (#171716)', fg: darkFg, bg: darkCard, min: 4.5 },
  { category: 'Typography', name: 'Foreground (#EDEDEA) on Raised/Muted (#1F1F1D)', fg: darkFg, bg: darkMuted, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground (#A3A29C) on Background (#0F0F0E)', fg: darkMutedFg, bg: darkBg, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground (#A3A29C) on Card (#171716)', fg: darkMutedFg, bg: darkCard, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground (#A3A29C) on Raised (#1F1F1D)', fg: darkMutedFg, bg: darkMuted, min: 4.5 },

  // Header Org Name
  { category: 'Header Chrome', name: 'Header Org Name (Foreground) on Header Bg', fg: darkFg, bg: darkBg, min: 4.5 },
  { category: 'Header Chrome', name: 'Header Org Name (Foreground) on Raised Pill', fg: darkFg, bg: darkMuted, min: 4.5 },

  // Buttons
  { category: 'Buttons', name: 'Primary Button Label (#111110) on Primary (#EDEDEA)', fg: darkPrimaryFg, bg: darkPrimary, min: 4.5 },
  { category: 'Buttons', name: 'Primary Button Label (#111110) on Hover (#D6D6D2)', fg: darkPrimaryFg, bg: darkPrimaryHover, min: 4.5 },
  { category: 'Buttons', name: 'Disabled Button Text (#A3A29C) on Raised (#1F1F1D)', fg: darkMutedFg, bg: darkMuted, min: 4.5 },

  // Semantic Badges / Status
  { category: 'Semantic', name: 'Success Text (#4ADE80) on Success Tint (#0F2417)', fg: darkSuccessText, bg: darkSuccessPill, min: 4.5 },
  { category: 'Semantic', name: 'Warning Text (#FBBF24) on Warning Tint (#2A1F07)', fg: darkWarningText, bg: darkWarningPill, min: 4.5 },
  { category: 'Semantic', name: 'Error Text (#F87171) on Error Tint (#2A1110)', fg: darkErrorText, bg: darkErrorPill, min: 4.5 },

  // Non-Text (3:1 minimum)
  { category: 'Non-Text', name: 'Focus Ring / Accent (#8AB4F8) vs Background', fg: darkRing, bg: darkBg, min: 3.0 },
  { category: 'Non-Text', name: 'Input Border Strong (#6E6D68) vs Background', fg: darkBorderStrong, bg: darkBg, min: 3.0 },

  // Monaco Editor Token Contrast (Dark Theme on #171716)
  { category: 'Editor Dark', name: 'Editor Foreground (#E4E4E7) vs Editor Surface', fg: parseCssColor('#E4E4E7'), bg: darkCard, min: 4.5 },
  { category: 'Editor Dark', name: 'Editor Keys (#93C5FD) vs Editor Surface', fg: parseCssColor('#93C5FD'), bg: darkCard, min: 4.5 },
  { category: 'Editor Dark', name: 'Editor Strings (#86EFAC) vs Editor Surface', fg: parseCssColor('#86EFAC'), bg: darkCard, min: 4.5 },
  { category: 'Editor Dark', name: 'Editor Numbers (#FDE047) vs Editor Surface', fg: parseCssColor('#FDE047'), bg: darkCard, min: 4.5 },
  { category: 'Editor Dark', name: 'Editor Keywords (#FDBA74) vs Editor Surface', fg: parseCssColor('#FDBA74'), bg: darkCard, min: 4.5 },
  { category: 'Editor Dark', name: 'Editor Punctuation (#A1A1AA) vs Editor Surface', fg: parseCssColor('#A1A1AA'), bg: darkCard, min: 4.5 },
  { category: 'Editor Dark', name: 'Editor Cursor (#EDEDEA) vs Editor Surface', fg: darkFg, bg: darkCard, min: 4.5 },
];

function runSuite(title, suite) {
  console.log(`\n=== ${title} ===`);
  let allPass = true;
  suite.forEach(t => {
    const ratio = getContrast(t.fg, t.bg);
    const pass = ratio >= t.min;
    if (!pass) allPass = false;
    const cat = `[${t.category}]`.padEnd(16);
    console.log(`${cat} ${t.name.padEnd(54)}: ${ratio.toFixed(2).padStart(5)}:1 (min ${t.min.toFixed(1)}:1) ${pass ? '✅ PASS' : '❌ FAIL'}`);
  });
  return allPass;
}

const lp = runSuite('LIGHT THEME WCAG 2.2 AA VERIFICATION (MONOCHROME PALETTE)', lightTests);
const dp = runSuite('DARK THEME WCAG 2.2 AA VERIFICATION (MONOCHROME PALETTE)', darkTests);

if (lp && dp) {
  console.log('\n>>> ALL AUDITED PAIRS (TEXT & NON-TEXT) MEET WCAG 2.2 AA IN BOTH THEMES <<<\n');
} else {
  console.error('\n>>> SOME PAIRS FAILED WCAG CHECKS <<<\n');
  process.exit(1);
}
