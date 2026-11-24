export const STATUS_COLOR_TONES = [
  "success",
  "warning",
  "danger",
  "info",
  "neutral",
  "violet",
] as const;

export type StatusColorTone = (typeof STATUS_COLOR_TONES)[number];

export const STATUS_COLOR_ALIAS_MAP: Readonly<Record<string, StatusColorTone>> = {
  // Canonical tones
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
  neutral: "neutral",
  violet: "violet",
  // Common color aliases
  green: "success",
  red: "danger",
  yellow: "warning",
  amber: "warning",
  orange: "warning",
  blue: "info",
  gray: "neutral",
  grey: "neutral",
  purple: "violet",
};

export const STATUS_KEYWORD_MAP: Readonly<Record<string, StatusColorTone>> = {
  // success
  running: "success",
  active: "success",
  completed: "success",
  done: "success",
  resolved: "success",
  published: "success",
  strong: "success",
  healthy: "success",
  good: "success",
  // warning
  pending: "warning",
  review: "warning",
  degraded: "warning",
  balanced: "warning",
  warning: "warning",
  // danger
  failed: "danger",
  error: "danger",
  critical: "danger",
  weak: "danger",
  blocked: "danger",
  overdue: "danger",
  // info
  idle: "info",
  draft: "info",
  new: "info",
  scheduled: "info",
  upcoming: "info",
};

export const STATUS_PILL_CLASSES: Readonly<
  Record<StatusColorTone, { pill: string; dot: string }>
> = {
  success: {
    pill: "bg-status-success-bg text-status-success-text border-status-success-border",
    dot: "bg-[var(--status-success-dot)]",
  },
  warning: {
    pill: "bg-status-warning-bg text-status-warning-text border-status-warning-border",
    dot: "bg-[var(--status-warning-dot)]",
  },
  danger: {
    pill: "bg-status-danger-bg text-status-danger-text border-status-danger-border",
    dot: "bg-[var(--status-danger-dot)]",
  },
  info: {
    pill: "bg-status-info-bg text-status-info-text border-status-info-border",
    dot: "bg-[var(--status-info-dot)]",
  },
  neutral: {
    pill: "bg-status-neutral-bg text-status-neutral-text border-status-neutral-border",
    dot: "bg-[var(--status-neutral-dot)]",
  },
  violet: {
    pill: "bg-status-violet-bg text-status-violet-text border-status-violet-border",
    dot: "bg-[var(--status-violet-dot)]",
  },
};

/**
 * Preprocesses a configured color tone string (canonical or alias).
 * Returns undefined for unrecognized values so resolution falls back
 * to keyword or hash mapping instead of failing validation.
 */
export function preprocessStatusColorTone(raw: unknown): StatusColorTone | undefined {
  if (typeof raw !== "string") return undefined;
  return STATUS_COLOR_ALIAS_MAP[raw.trim().toLowerCase()];
}

/**
 * Normalizes a column `colors` record before Zod validation:
 * - Maps canonical tones and color aliases (green, red, yellow/amber/orange, blue, gray/grey, purple)
 * - Drops unrecognized values (e.g. "sparkly") so they fall back to keyword/hash resolution
 */
export function preprocessStatusColorsMap(
  colors: unknown
): Record<string, StatusColorTone> | undefined {
  if (!colors || typeof colors !== "object" || Array.isArray(colors)) {
    return undefined;
  }
  const normalized: Record<string, StatusColorTone> = {};
  for (const [key, value] of Object.entries(colors as Record<string, unknown>)) {
    const tone = preprocessStatusColorTone(value);
    if (tone) {
      normalized[key] = tone;
    }
  }
  return normalized;
}

/**
 * Deterministic 32-bit FNV-1a hash used to stably map unknown status values
 * to either "neutral" or "violet".
 */
function hashStatusString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Resolves a DataTable status cell value into a semantic StatusColorTone:
 * 1) Explicit `colors` map from column config (canonical or preprocessed color alias;
 *    unrecognized tone values fall through rather than failing)
 * 2) Built-in case-insensitive keyword map
 * 3) Stable hash fallback into "neutral" or "violet"
 */
export function resolveStatusColor(
  value: unknown,
  explicitColors?: Record<string, string>
): StatusColorTone {
  const raw = String(value ?? "").trim();
  const normalized = raw.toLowerCase();

  // 1) Explicit colors map from column config (with alias preprocessing)
  if (explicitColors && typeof explicitColors === "object") {
    const exactMatch = preprocessStatusColorTone(explicitColors[raw]);
    if (exactMatch) {
      return exactMatch;
    }

    for (const [key, rawTone] of Object.entries(explicitColors)) {
      if (key.trim().toLowerCase() === normalized) {
        const mappedTone = preprocessStatusColorTone(rawTone);
        if (mappedTone) {
          return mappedTone;
        }
      }
    }
  }

  // 2) Built-in case-insensitive keyword map
  const keywordMatch = STATUS_KEYWORD_MAP[normalized];
  if (keywordMatch) {
    return keywordMatch;
  }

  // 3) Stable hash into neutral or violet
  return hashStatusString(normalized) % 2 === 0 ? "neutral" : "violet";
}
