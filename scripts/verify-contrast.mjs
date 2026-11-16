// Comprehensive WCAG 2.2 AA Contrast Verification Script for AppForge
// Self-contained: No external packages required.

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

// Color definitions
const white = [255, 255, 255];
const black = [0, 0, 0];
const lightBg = hexToRgb('#FAFAFA');
const lightCard = [255, 255, 255];
const lightMuted = hexToRgb('#F4F4F5');
const lightFg = hexToRgb('#18181B');
const lightMutedFg = hexToRgb('#6B6B70');
const lightInput = hexToRgb('#8E8E93');

const brandLight = hexToRgb('#6D28D9'); // Violet 700
const brandLightHover = hexToRgb('#5B21B6'); // Violet 800
const brandLightActive = hexToRgb('#4C1D95'); // Violet 900

const darkBg = hexToRgb('#18181B');
const darkCard = hexToRgb('#27272A');
const darkMuted = hexToRgb('#3F3F46');
const darkFg = [255, 255, 255];
const darkMutedFg = hexToRgb('#B4B4BB'); // oklch(0.75 0 0) - passes AA against muted surface
const darkInput = hexToRgb('#71717A');

const brandDark = hexToRgb('#A78BFA'); // Single dark brand token: Violet 400
const brandDarkHover = hexToRgb('#C4B5FD'); // Violet 300
const brandDarkActive = hexToRgb('#8B5CF6'); // Violet 500
const brandDarkTextInverse = hexToRgb('#09090B'); // High contrast button label on #A78BFA

// Badges & Pills
const blushErrorTextLight = hexToRgb('#8C2E44');
const blushErrorPillLight = hexToRgb('#FBEAEE');
const peachWarningTextLight = hexToRgb('#784A15');
const peachWarningPillLight = hexToRgb('#FDF1E7');
const mintSuccessTextLight = hexToRgb('#2F7A55');
const mintSuccessPillLight = hexToRgb('#EAF7F0');

const blushErrorTextDark = hexToRgb('#F472B6');
const blushErrorPillDark = hexToRgb('#2E1119');
const peachWarningTextDark = hexToRgb('#FBBF24');
const peachWarningPillDark = hexToRgb('#2D1E0A');
const mintSuccessTextDark = hexToRgb('#34D399');
const mintSuccessPillDark = hexToRgb('#0B281A');

const lightTests = [
  // Typography (4.5:1)
  { category: 'Typography', name: 'Foreground on Background', fg: lightFg, bg: lightBg, min: 4.5 },
  { category: 'Typography', name: 'Foreground on Card', fg: lightFg, bg: lightCard, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground on Background', fg: lightMutedFg, bg: lightBg, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground on Muted Surface', fg: lightMutedFg, bg: lightMuted, min: 4.5 },
  { category: 'Typography', name: 'Brand Text (#6D28D9) on Background', fg: brandLight, bg: lightBg, min: 4.5 },
  { category: 'Typography', name: 'Brand Text (#6D28D9) on Card', fg: brandLight, bg: lightCard, min: 4.5 },

  // Buttons (4.5:1)
  { category: 'Buttons', name: 'Button Label (#FFFFFF) on Brand (#6D28D9)', fg: white, bg: brandLight, min: 4.5 },
  { category: 'Buttons', name: 'Button Label (#FFFFFF) on Hover (#5B21B6)', fg: white, bg: brandLightHover, min: 4.5 },
  { category: 'Buttons', name: 'Button Label (#FFFFFF) on Active (#4C1D95)', fg: white, bg: brandLightActive, min: 4.5 },

  // Badges & Pills (4.5:1)
  { category: 'Badges/Pills', name: 'Error Text (#8C2E44) on Error Pill (#FBEAEE)', fg: blushErrorTextLight, bg: blushErrorPillLight, min: 4.5 },
  { category: 'Badges/Pills', name: 'Warning Text (#784A15) on Warning Pill (#FDF1E7)', fg: peachWarningTextLight, bg: peachWarningPillLight, min: 4.5 },
  { category: 'Badges/Pills', name: 'Success Text (#2F7A55) on Success Pill (#EAF7F0)', fg: mintSuccessTextLight, bg: mintSuccessPillLight, min: 4.5 },

  // Non-Text Contrast (3:1 per WCAG 1.4.11)
  { category: 'Non-Text', name: 'Solid Focus Ring (#6D28D9) vs Background', fg: brandLight, bg: lightBg, min: 3.0 },
  { category: 'Non-Text', name: 'Input Border (#8E8E93) vs Background', fg: lightInput, bg: lightBg, min: 3.0 },
];

const darkTests = [
  // Typography (4.5:1)
  { category: 'Typography', name: 'Foreground on Background', fg: darkFg, bg: darkBg, min: 4.5 },
  { category: 'Typography', name: 'Foreground on Card', fg: darkFg, bg: darkCard, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground on Background', fg: darkMutedFg, bg: darkBg, min: 4.5 },
  { category: 'Typography', name: 'Muted Foreground on Muted Surface', fg: darkMutedFg, bg: darkMuted, min: 4.5 },
  { category: 'Typography', name: 'Brand Text (#A78BFA) on Background', fg: brandDark, bg: darkBg, min: 4.5 },
  { category: 'Typography', name: 'Brand Text (#A78BFA) on Card', fg: brandDark, bg: darkCard, min: 4.5 },

  // Buttons (4.5:1)
  { category: 'Buttons', name: 'Button Label (#09090B) on Brand (#A78BFA)', fg: brandDarkTextInverse, bg: brandDark, min: 4.5 },
  { category: 'Buttons', name: 'Button Label (#09090B) on Hover (#C4B5FD)', fg: brandDarkTextInverse, bg: brandDarkHover, min: 4.5 },
  { category: 'Buttons', name: 'Button Label (#09090B) on Active (#8B5CF6)', fg: brandDarkTextInverse, bg: hexToRgb('#8B5CF6'), min: 4.5 },

  // Badges & Pills (4.5:1)
  { category: 'Badges/Pills', name: 'Error Text (#F472B6) on Error Pill (#2E1119)', fg: blushErrorTextDark, bg: blushErrorPillDark, min: 4.5 },
  { category: 'Badges/Pills', name: 'Warning Text (#FBBF24) on Warning Pill (#2D1E0A)', fg: peachWarningTextDark, bg: peachWarningPillDark, min: 4.5 },
  { category: 'Badges/Pills', name: 'Success Text (#34D399) on Success Pill (#0B281A)', fg: mintSuccessTextDark, bg: mintSuccessPillDark, min: 4.5 },

  // Non-Text Contrast (3:1 per WCAG 1.4.11)
  { category: 'Non-Text', name: 'Solid Focus Ring (#A78BFA) vs Background', fg: brandDark, bg: darkBg, min: 3.0 },
  { category: 'Non-Text', name: 'Input Border (#71717A) vs Background', fg: darkInput, bg: darkBg, min: 3.0 },
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

const lp = runSuite('LIGHT THEME WCAG 2.2 AA VERIFICATION', lightTests);
const dp = runSuite('DARK THEME WCAG 2.2 AA VERIFICATION', darkTests);

if (lp && dp) {
  console.log('\n>>> ALL AUDITED PAIRS (TEXT & NON-TEXT) MEET WCAG 2.2 AA IN BOTH THEMES <<<\n');
} else {
  console.error('\n>>> SOME PAIRS FAILED WCAG CHECKS <<<\n');
  process.exit(1);
}
