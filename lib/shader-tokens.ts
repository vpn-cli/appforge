/**
 * Hero Mesh Gradient Design Tokens
 *
 * Sourced directly from CSS Custom Properties in app/globals.css:
 * Light mode: canvas (--canvas / --mesh-c1), brand-200 (--brand-200), brand-300 (--brand-300), light indigo/periwinkle (--wash-blue / --mesh-c4)
 * Dark mode:  ink-950 (--ink-950), brand-800 (--brand-800), brand-500 (--brand-500), indigo (--indigo / --brand-headline-end)
 *
 * Centralizes shader palette tokens and dynamic CSS DOM extraction,
 * eliminating raw hex literals from component files.
 */

export const MESH_COLOR_TOKENS = [
  "--mesh-c1",
  "--mesh-c2",
  "--mesh-c3",
  "--mesh-c4",
] as const;

export type MeshColorToken = (typeof MESH_COLOR_TOKENS)[number];

export const MESH_DEFAULT_PALETTES = {
  dark: ["#0B0B12", "#3E2F9A", "#6D5BF0", "#4F6BFF"] as const,
  light: ["#F6F6FB", "#CFCBFE", "#ADA6FC", "#E3EAFF"] as const,
} as const;

export type ShaderThemeKey = keyof typeof MESH_DEFAULT_PALETTES;

/**
 * Reads the 4 computed mesh gradient color tokens from the document root.
 */
export function readMeshTokensFromDOM(): string[] {
  if (typeof window === "undefined") return [];
  const styles = window.getComputedStyle(document.documentElement);
  const base = MESH_COLOR_TOKENS.map((token) => styles.getPropertyValue(token).trim()).filter(Boolean);
  return base;
}

/**
 * Returns initial mesh palette for a given theme key:
 * Reads computed CSS tokens if available, or falls back to canonical theme tokens.
 */
export function getInitialMeshPalette(themeKey: string): string[] {
  const fromDom = readMeshTokensFromDOM();
  if (fromDom.length >= 4) {
    return fromDom;
  }
  const key: ShaderThemeKey = themeKey === "light" ? "light" : "dark";
  return [...MESH_DEFAULT_PALETTES[key]];
}

function parseColorToVec3(colorStr: string): [number, number, number] {
  if (!colorStr) return [0, 0, 0];
  const s = colorStr.trim();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16) / 255,
        parseInt(hex[1] + hex[1], 16) / 255,
        parseInt(hex[2] + hex[2], 16) / 255,
      ];
    }
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
    ];
  }
  const rgbMatch = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [
      Number(rgbMatch[1]) / 255,
      Number(rgbMatch[2]) / 255,
      Number(rgbMatch[3]) / 255,
    ];
  }
  return [0, 0, 0];
}

export function readMeshPaletteTokens(isDark: boolean): {
  c0: [number, number, number];
  c1: [number, number, number];
  c2: [number, number, number];
  c3: [number, number, number];
} {
  if (typeof window === "undefined") {
    return isDark
      ? {
          c0: [11 / 255, 11 / 255, 18 / 255],
          c1: [62 / 255, 47 / 255, 154 / 255],
          c2: [109 / 255, 91 / 255, 240 / 255],
          c3: [79 / 255, 107 / 255, 255 / 255],
        }
      : {
          c0: [242 / 255, 241 / 255, 249 / 255],
          c1: [207 / 255, 203 / 255, 254 / 255],
          c2: [173 / 255, 166 / 255, 252 / 255],
          c3: [227 / 255, 234 / 255, 255 / 255],
        };
  }

  const styles = window.getComputedStyle(document.documentElement);
  if (isDark) {
    const rawC0 = styles.getPropertyValue("--ink-950").trim();
    const rawC1 = styles.getPropertyValue("--brand-800").trim();
    const rawC2 = styles.getPropertyValue("--brand-500").trim();
    const rawC3 = (styles.getPropertyValue("--indigo") || styles.getPropertyValue("--brand-headline-end")).trim();
    return {
      c0: parseColorToVec3(rawC0) || [11 / 255, 11 / 255, 18 / 255],
      c1: parseColorToVec3(rawC1) || [62 / 255, 47 / 255, 154 / 255],
      c2: parseColorToVec3(rawC2) || [109 / 255, 91 / 255, 240 / 255],
      c3: parseColorToVec3(rawC3) || [79 / 255, 107 / 255, 255 / 255],
    };
  } else {
    const rawC0 = (styles.getPropertyValue("--canvas") || styles.getPropertyValue("--mesh-c1")).trim();
    const rawC1 = styles.getPropertyValue("--brand-200").trim();
    const rawC2 = styles.getPropertyValue("--brand-300").trim();
    const rawC3 = (styles.getPropertyValue("--wash-blue") || styles.getPropertyValue("--mesh-c4")).trim();
    return {
      c0: parseColorToVec3(rawC0) || [242 / 255, 241 / 255, 249 / 255],
      c1: parseColorToVec3(rawC1) || [207 / 255, 203 / 255, 254 / 255],
      c2: parseColorToVec3(rawC2) || [173 / 255, 166 / 255, 252 / 255],
      c3: parseColorToVec3(rawC3) || [227 / 255, 234 / 255, 255 / 255],
    };
  }
}
