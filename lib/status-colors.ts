export const STATUS_COLOR_TONES = [
  "success",
  "warning",
  "danger",
  "info",
  "neutral",
  "violet",
] as const;

export type StatusColorTone = (typeof STATUS_COLOR_TONES)[number];

const VALID_TONE_SET: ReadonlySet<string> = new Set(STATUS_COLOR_TONES);

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

function isValidTone(value: unknown): value is StatusColorTone {
  return typeof value === "string" && VALID_TONE_SET.has(value);
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
 * 1) Explicit `colors` map from column config (exact key match, then case-insensitive)
 * 2) Built-in case-insensitive keyword map
 * 3) Stable hash fallback into "neutral" or "violet"
 */
export function resolveStatusColor(
  value: unknown,
  explicitColors?: Record<string, StatusColorTone>
): StatusColorTone {
  const raw = String(value ?? "").trim();
  const normalized = raw.toLowerCase();

  // 1) Explicit colors map from column config
  if (explicitColors && typeof explicitColors === "object") {
    const exactMatch = explicitColors[raw];
    if (isValidTone(exactMatch)) {
      return exactMatch;
    }

    for (const [key, tone] of Object.entries(explicitColors)) {
      if (key.trim().toLowerCase() === normalized && isValidTone(tone)) {
        return tone;
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
