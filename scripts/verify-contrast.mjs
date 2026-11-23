import fs from 'node:fs';
import path from 'node:path';

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

function blend(fgRgba, bgRgb) {
  const a = fgRgba[3] ?? 1;
  return [
    Math.round(fgRgba[0] * a + bgRgb[0] * (1 - a)),
    Math.round(fgRgba[1] * a + bgRgb[1] * (1 - a)),
    Math.round(fgRgba[2] * a + bgRgb[2] * (1 - a))
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
      val.length === 8 ? parseInt(val.slice(6, 8), 16) / 255 : 1
    ];
  }
  const rgbaMatch = val.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (rgbaMatch) {
    return [
      parseFloat(rgbaMatch[1]),
      parseFloat(rgbaMatch[2]),
      parseFloat(rgbaMatch[3]),
      rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
    ];
  }
  throw new Error(`Unsupported color format in globals.css: "${rawVal}"`);
}

// Read and parse app/globals.css
const cssPath = path.resolve('app/globals.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

function extractScope(content, selector) {
  const regex = new RegExp(`(?:^|\\n)\\s*${selector}[^{]*\\{([\\s\\S]*?)\\}`, 'm');
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

function resolveToken(tokenName, scope = 'root') {
  const merged = scope === 'dark' ? { ...rootTokens, ...darkTokens } : rootTokens;
  let val = merged[tokenName];
  if (!val) throw new Error(`Token ${tokenName} not found in scope ${scope}`);
  while (val.startsWith('var(')) {
    const inner = val.slice(4, -1).trim();
    val = merged[inner];
    if (!val) throw new Error(`Inner token ${inner} not found in scope ${scope}`);
  }
  return parseCssColor(val);
}

// Key tokens light
const lightCanvas = resolveToken('--canvas', 'root');
const lightSurface = resolveToken('--surface', 'root');
const lightSurfaceSunken = resolveToken('--surface-sunken', 'root');
const lightTextPrimary = resolveToken('--text-primary', 'root');
const lightTextSecondary = resolveToken('--text-secondary', 'root');
const lightTextMuted = resolveToken('--text-muted', 'root');
const lightBrandLink = resolveToken('--brand-link', 'root');
const lightPrimary = resolveToken('--brand-600', 'root');
const lightPrimaryHover = resolveToken('--brand-500', 'root');
const lightBrand500 = resolveToken('--brand-500', 'root');
const lightWhite = parseCssColor('#FFFFFF');

const lightSuccessText = resolveToken('--status-success-text', 'root');
const lightSuccessBg = resolveToken('--status-success-bg', 'root');
const lightInfoText = resolveToken('--status-info-text', 'root');
const lightInfoBg = resolveToken('--status-info-bg', 'root');
const lightWarningText = resolveToken('--status-warning-text', 'root');
const lightWarningBg = resolveToken('--status-warning-bg', 'root');
const lightDangerText = resolveToken('--status-danger-text', 'root');
const lightDangerBg = resolveToken('--status-danger-bg', 'root');

// Key tokens dark
const darkCanvas = resolveToken('--canvas', 'dark');
const darkSurface = resolveToken('--surface', 'dark');
const darkRaised = resolveToken('--raised', 'dark');
const darkTextPrimary = resolveToken('--text-primary', 'dark');
const darkTextSecondary = resolveToken('--text-secondary', 'dark');
const darkTextMuted = resolveToken('--text-muted', 'dark');
const darkBrandLink = resolveToken('--brand-link', 'dark');

const darkSuccessText = resolveToken('--status-success-text', 'dark');
const darkSuccessBg = blend(resolveToken('--status-success-bg', 'dark'), darkSurface);
const darkInfoText = resolveToken('--status-info-text', 'dark');
const darkInfoBg = blend(resolveToken('--status-info-bg', 'dark'), darkSurface);
const darkWarningText = resolveToken('--status-warning-text', 'dark');
const darkWarningBg = blend(resolveToken('--status-warning-bg', 'dark'), darkSurface);
const darkDangerText = resolveToken('--status-danger-text', 'dark');
const darkDangerBg = blend(resolveToken('--status-danger-bg', 'dark'), darkSurface);

const lightTests = [
  // Typography
  { category: 'Typography', name: 'text-primary (ink-900) on canvas (#F2F1F9)', fg: lightTextPrimary, bg: lightCanvas, min: 4.5 },
  { category: 'Typography', name: 'text-primary (ink-900) on surface (#FFFFFF)', fg: lightTextPrimary, bg: lightSurface, min: 4.5 },
  { category: 'Typography', name: 'text-primary (ink-900) on surface-sunken (#ECEBF5)', fg: lightTextPrimary, bg: lightSurfaceSunken, min: 4.5 },
  { category: 'Typography', name: 'text-secondary (ink-600) on canvas (#F2F1F9)', fg: lightTextSecondary, bg: lightCanvas, min: 4.5 },
  { category: 'Typography', name: 'text-secondary (ink-600) on surface (#FFFFFF)', fg: lightTextSecondary, bg: lightSurface, min: 4.5 },
  { category: 'Typography', name: 'text-muted (ink-500) on surface (#FFFFFF)', fg: lightTextMuted, bg: lightSurface, min: 4.5 },

  // Buttons & Links
  { category: 'Buttons', name: 'Primary Button Label (White) on brand-600', fg: lightWhite, bg: lightPrimary, min: 4.5 },
  { category: 'Buttons', name: 'Primary Button Label (White) on Hover brand-500', fg: lightWhite, bg: lightPrimaryHover, min: 4.5 },
  { category: 'Buttons', name: 'Secondary Button Label (ink-900) on surface (#FFFFFF)', fg: lightTextPrimary, bg: lightSurface, min: 4.5 },
  { category: 'Links', name: 'Ghost / Brand Link (brand-600) on canvas (#F2F1F9)', fg: lightBrandLink, bg: lightCanvas, min: 4.5 },
  { category: 'Links', name: 'Ghost / Brand Link (brand-600) on surface (#FFFFFF)', fg: lightBrandLink, bg: lightSurface, min: 4.5 },

  // Status Pills
  { category: 'Status Pills', name: 'Success Text (#0F6B3A) on Success Bg (#E3F6EA)', fg: lightSuccessText, bg: lightSuccessBg, min: 4.5 },
  { category: 'Status Pills', name: 'Info Text (#1D4ED8) on Info Bg (#E6EEFF)', fg: lightInfoText, bg: lightInfoBg, min: 4.5 },
  { category: 'Status Pills', name: 'Warning Text (#92560A) on Warning Bg (#FDF1DC)', fg: lightWarningText, bg: lightWarningBg, min: 4.5 },
  { category: 'Status Pills', name: 'Danger Text (#A61B1B) on Danger Bg (#FDE7E7)', fg: lightDangerText, bg: lightDangerBg, min: 4.5 },

  // Non-Text UI Elements (3:1 minimum)
  { category: 'UI Non-Text', name: 'Focus Ring (brand-500) vs canvas (#F2F1F9)', fg: lightBrand500, bg: lightCanvas, min: 3.0 },
  { category: 'UI Non-Text', name: 'Focus Ring (brand-500) vs surface (#FFFFFF)', fg: lightBrand500, bg: lightSurface, min: 3.0 },
];

const darkTests = [
  // Typography
  { category: 'Typography', name: 'text-primary (#F2F2F7) on canvas (ink-950 #0B0B12)', fg: darkTextPrimary, bg: darkCanvas, min: 4.5 },
  { category: 'Typography', name: 'text-primary (#F2F2F7) on surface (#16161F)', fg: darkTextPrimary, bg: darkSurface, min: 4.5 },
  { category: 'Typography', name: 'text-primary (#F2F2F7) on raised (#1F1F2B)', fg: darkTextPrimary, bg: darkRaised, min: 4.5 },
  { category: 'Typography', name: 'text-secondary (#A9A9BD) on canvas (ink-950 #0B0B12)', fg: darkTextSecondary, bg: darkCanvas, min: 4.5 },
  { category: 'Typography', name: 'text-secondary (#A9A9BD) on surface (#16161F)', fg: darkTextSecondary, bg: darkSurface, min: 4.5 },
  { category: 'Typography', name: 'text-muted (#8A8AA0) on surface (#16161F)', fg: darkTextMuted, bg: darkSurface, min: 4.5 },

  // Buttons & Links
  { category: 'Buttons', name: 'Primary Button Label (White) on brand-600', fg: lightWhite, bg: lightPrimary, min: 4.5 },
  { category: 'Buttons', name: 'Primary Button Label (White) on Hover brand-500', fg: lightWhite, bg: lightPrimaryHover, min: 4.5 },
  { category: 'Buttons', name: 'Secondary Button Label (text-primary) on raised (#1F1F2B)', fg: darkTextPrimary, bg: darkRaised, min: 4.5 },
  { category: 'Links', name: 'Ghost / Brand Link (brand-300) on canvas (ink-950)', fg: darkBrandLink, bg: darkCanvas, min: 4.5 },
  { category: 'Links', name: 'Ghost / Brand Link (brand-300) on surface (#16161F)', fg: darkBrandLink, bg: darkSurface, min: 4.5 },

  // Status Pills
  { category: 'Status Pills', name: 'Success Text (#4ADE80) on 15% tint over surface', fg: darkSuccessText, bg: darkSuccessBg, min: 4.5 },
  { category: 'Status Pills', name: 'Info Text (#60A5FA) on 15% tint over surface', fg: darkInfoText, bg: darkInfoBg, min: 4.5 },
  { category: 'Status Pills', name: 'Warning Text (#FBBF24) on 15% tint over surface', fg: darkWarningText, bg: darkWarningBg, min: 4.5 },
  { category: 'Status Pills', name: 'Danger Text (#F87171) on 15% tint over surface', fg: darkDangerText, bg: darkDangerBg, min: 4.5 },

  // Non-Text UI Elements (3:1 minimum)
  { category: 'UI Non-Text', name: 'Focus Ring (brand-500) vs canvas (ink-950)', fg: lightBrand500, bg: darkCanvas, min: 3.0 },
  { category: 'UI Non-Text', name: 'Focus Ring (brand-500) vs surface (#16161F)', fg: lightBrand500, bg: darkSurface, min: 3.0 },
];

function runSuite(title, suite) {
  console.log(`\n=== ${title} ===`);
  let allPass = true;
  suite.forEach(t => {
    const ratio = getContrast(t.fg, t.bg);
    const pass = ratio >= t.min;
    if (!pass) allPass = false;
    const cat = `[${t.category}]`.padEnd(16);
    console.log(`${cat} ${t.name.padEnd(58)}: ${ratio.toFixed(2).padStart(5)}:1 (min ${t.min.toFixed(1)}:1) ${pass ? '✅ PASS' : '❌ FAIL'}`);
  });
  return allPass;
}

const lp = runSuite('LIGHT THEME WCAG CONTRAST VERIFICATION (FORGE VIOLET & INK)', lightTests);
const dp = runSuite('DARK THEME WCAG CONTRAST VERIFICATION (FORGE VIOLET & INK)', darkTests);

if (lp && dp) {
  console.log('\n>>> ALL AUDITED PAIRS (TEXT ≥ 4.5:1, UI ≥ 3:1) MEET WCAG IN BOTH THEMES <<<\n');
} else {
  console.error('\n>>> SOME PAIRS FAILED WCAG CHECKS <<<\n');
  process.exit(1);
}
