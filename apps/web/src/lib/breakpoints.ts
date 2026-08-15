/**
 * TS mirror of the canonical breakpoints in `styles/tokens.css` (ADR-0024).
 * `sizes` attributes are strings built in TS, so the `@custom-media` rules
 * can't be read directly; `breakpoints.test.ts` re-derives every value from
 * tokens.css so the two sources cannot drift silently.
 */
export const BREAKPOINTS = {
  /** `--bp-small` — phones. */
  smallMax: 767.98,
  /** `--bp-below-desktop` — everything under the 12-col desktop grid. */
  belowDesktopMax: 1023.98,
  /** `--bp-960` — carousel/rail collapse. */
  railNarrowMax: 959.98,
  /** `--bp-600` — carousel/rail tight collapse. */
  railTightMax: 599.98,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS
