/**
 * Hero Mesh Gradient Design Tokens
 *
 * Sourced directly from CSS Custom Properties in app/globals.css:
 * Light mode: --mesh-c1 through --mesh-c4
 * Dark mode:  --mesh-c1 through --mesh-c4
 *
 * Centralizes shader palette tokens and SSR/initial fallback palettes,
 * eliminating raw hex literals from component files like HeroMeshShader.tsx.
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
