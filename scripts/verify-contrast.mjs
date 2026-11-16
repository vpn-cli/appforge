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
    Math.round(toGamma(bLin) * 255),
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
const lightRing = parseCssColor(rootTokens['--ring']);
const brandLight = parseCssColor(rootTokens['--theme-brand']);
const brandLightHover = parseCssColor(rootTokens['--theme-brand-dark']);
const blushErrorTextLight = parseCssColor(rootTokens['--theme-error-text']);
const blushErrorPillLight = parseCssColor(rootTokens['--theme-error-light']);
const peachWarningTextLight = parseCssColor(rootTokens['--theme-warning-text']);
const peachWarningPillLight = parseCssColor(rootTokens['--theme-warning-light']);
const mintSuccessTextLight = parseCssColor(rootTokens['--theme-success-text']);
const mintSuccessPillLight = parseCssColor(rootTokens['--theme-success-light']);

// Dark Theme Values parsed dynamically
const darkBg = parseCssColor(darkTokens['--background']);
const darkCard = parseCssColor(darkTokens['--card']);
const darkFg = parseCssColor(darkTokens['--foreground']);
const darkMuted = parseCssColor(darkTokens['--muted']);
const darkMutedFg = parseCssColor(darkTokens['--muted-foreground']);
const darkInput = parseCssColor(darkTokens['--input']);
const darkRing = parseCssColor(darkTokens['--ring']);
const brandDark = parseCssColor(darkTokens['--theme-brand']);
const brandDarkActive = parseCssColor(darkTokens['--theme-brand-dark']);
const brandDarkHover = parseCssColor('#C4B5FD');
const darkButtonLabel = parseCssColor('#09090B'); // Standardized dark button label
const blushErrorTextDark = parseCssColor(darkTokens['--theme-error-text']);
const blushErrorPillDark = parseCssColor(darkTokens['--theme-error-light']);
const peachWarningTextDark = parseCssColor(darkTokens['--theme-warning-text']);
const peachWarningPillDark = parseCssColor(darkTokens['--theme-warning-light']);
const mintSuccessTextDark = parseCssColor(darkTokens['--theme-success-text']);
const mintSuccessPillDark = parseCssColor(darkTokens['--theme-success-light']);

const lightTests = [
  { category: 'Typography', name: 'Foreground on Background', fg: lightFg, bg: lightBg, min: 4.5 },
  { category: 'Typography', name: 'Foreground on Card', fg: lightFg, bg: lightCard, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground on Background', fg: lightMutedFg, bg: lightBg, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground on Muted Surface', fg: lightMutedFg, bg: lightMuted, min: 4.5 },
  { category: 'Typography', name: 'Brand Text on Background', fg: brandLight, bg: lightBg, min: 4.5 },
  { category: 'Typography', name: 'Brand Text on Card', fg: brandLight, bg: lightCard, min: 4.5 },

  { category: 'Buttons', name: 'Button Label (#FFFFFF) on Brand', fg: [255, 255, 255], bg: brandLight, min: 4.5 },
  { category: 'Buttons', name: 'Button Label (#FFFFFF) on Hover', fg: [255, 255, 255], bg: brandLightHover, min: 4.5 },

  { category: 'Badges/Pills', name: 'Error Text on Error Pill', fg: blushErrorTextLight, bg: blushErrorPillLight, min: 4.5 },
  { category: 'Badges/Pills', name: 'Warning Text on Warning Pill', fg: peachWarningTextLight, bg: peachWarningPillLight, min: 4.5 },
  { category: 'Badges/Pills', name: 'Success Text on Success Pill', fg: mintSuccessTextLight, bg: mintSuccessPillLight, min: 4.5 },

  { category: 'Non-Text', name: 'Solid Focus Ring vs Background', fg: lightRing, bg: lightBg, min: 3.0 },
  { category: 'Non-Text', name: 'Input Border vs Background', fg: lightInput, bg: lightBg, min: 3.0 },
];

const darkTests = [
  { category: 'Typography', name: 'Foreground on Background', fg: darkFg, bg: darkBg, min: 4.5 },
  { category: 'Typography', name: 'Foreground on Card', fg: darkFg, bg: darkCard, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground on Background', fg: darkMutedFg, bg: darkBg, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground on Muted Surface', fg: darkMutedFg, bg: darkMuted, min: 4.5 },
  { category: 'Typography', name: 'Brand Text on Background', fg: brandDark, bg: darkBg, min: 4.5 },
  { category: 'Typography', name: 'Brand Text on Card', fg: brandDark, bg: darkCard, min: 4.5 },

  { category: 'Buttons', name: 'Button Label (#09090B) on Brand', fg: darkButtonLabel, bg: brandDark, min: 4.5 },
  { category: 'Buttons', name: 'Button Label (#09090B) on Hover', fg: darkButtonLabel, bg: brandDarkHover, min: 4.5 },
  { category: 'Buttons', name: 'Button Label (#09090B) on Active', fg: darkButtonLabel, bg: brandDarkActive, min: 4.5 },

  { category: 'Badges/Pills', name: 'Error Text on Error Pill (Rose)', fg: blushErrorTextDark, bg: blushErrorPillDark, min: 4.5 },
  { category: 'Badges/Pills', name: 'Error Text on Dark Card (Rose)', fg: blushErrorTextDark, bg: darkCard, min: 4.5 },
  { category: 'Badges/Pills', name: 'Warning Text on Warning Pill', fg: peachWarningTextDark, bg: peachWarningPillDark, min: 4.5 },
  { category: 'Badges/Pills', name: 'Success Text on Success Pill', fg: mintSuccessTextDark, bg: mintSuccessPillDark, min: 4.5 },

  { category: 'Non-Text', name: 'Solid Focus Ring vs Background', fg: darkRing, bg: darkBg, min: 3.0 },
  { category: 'Non-Text', name: 'Input Border vs Background', fg: darkInput, bg: darkBg, min: 3.0 },
];

function runSuite(title, suite) {
  console.log(`\n=== ${title} ===`);
  let allPass = true;
  suite.forEach(t => {
    const ratio = getContrast(t.fg, t.bg);
    const pass = ratio >= t.min;
    if (!pass) allPass = false;
    const cat = `[${t.category}]`.padEnd(14);
    console.log(`${cat} ${t.name.padEnd(52)}: ${ratio.toFixed(2).padStart(5)}:1 (min ${t.min.toFixed(1)}:1) ${pass ? '✅ PASS' : '❌ FAIL'}`);
  });
  return allPass;
}

const lp = runSuite('LIGHT THEME WCAG 2.2 AA VERIFICATION (DIRECT FROM GLOBALS.CSS)', lightTests);
const dp = runSuite('DARK THEME WCAG 2.2 AA VERIFICATION (DIRECT FROM GLOBALS.CSS)', darkTests);

if (lp && dp) {
  console.log('\n>>> ALL AUDITED PAIRS (TEXT & NON-TEXT) MEET WCAG 2.2 AA IN BOTH THEMES <<<\n');
} else {
  console.error('\n>>> SOME PAIRS FAILED WCAG CHECKS <<<\n');
  process.exit(1);
}
