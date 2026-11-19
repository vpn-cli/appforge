/**
 * AppForge Motion Tokens
 * Central motion specifications ensuring crisp, consistent transitions.
 *
 * Rules:
 * - duration-fast: 150ms (micro-interactions, tooltips, checkmarks)
 * - duration-base: 250ms (standard state changes, dropdowns, color shifts)
 * - duration-slow: 400ms (draw-in reveals, panel collapses)
 * - standard spring: bounce 0.15, visual duration 0.4s
 * - No UI transition anywhere longer than 600ms (except a one-time draw-in).
 */
export const MOTION_TOKENS = {
  durationFastMs: 150,
  durationBaseMs: 250,
  durationSlowMs: 400,
  maxTransitionMs: 600,
  easeStandard: [0.15, 0, 0.2, 1] as const,
  springStandard: {
    type: "spring" as const,
    bounce: 0.15,
    visualDuration: 0.4,
  },
} as const;
