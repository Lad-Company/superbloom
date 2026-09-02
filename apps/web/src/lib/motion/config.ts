export const MOTION = {
  instant: 0.12,
  quick: 0.24,
  standard: 0.48,
  deliberate: 0.8,
  chapter: 1.2,
} as const

export const EASE = {
  in: 'power3.in',
  out: 'power3.out',
  inOut: 'power3.inOut',
  /** Constant speed — stat count-ups and scrub-driven motion. */
  linear: 'linear',
  /** Fast rise with a slight overshoot settle — the Type/Stat Reveal landing. */
  snap: 'back.out(1.2)',
} as const

export const STAGGER = {
  tight: 0.012,
  standard: 0.024,
} as const

export const SCROLL = {
  lerp: 0.1,
  scrubLag: 0.6,
} as const

export const POINTER = {
  frontTravel: 0.55,
  depthFalloff: 0.6,
  lagFront: 0.35,
  lagDeep: 0.9,
} as const

/** Parallax Field (the shared ParallaxStatement section: home parallax, zine
 *  landing intro, Who We Are intro): a persistent scattered
 *  media composition whose items sit at random depths. Depth drives the
 *  pointer push-away (closer items are repelled harder and settle faster),
 *  the scroll scrub (closer sweeps more of its own height), and the static
 *  depth cues (size, z-order). */
export const PARALLAX_FIELD = {
  maxItems: 10,
  /** Push-away: px of repulsion at the cursor's position for the closest /
   *  farthest layers; falls off to zero at pushRadius. */
  pushNear: 140,
  pushFar: 40,
  /** Push falloff radius, as a fraction of the section width. */
  pushRadius: 0.35,
  /** Push-away settle time in seconds for the closest / farthest layers.
   *  The same slow ease-out covers the rebound home when the cursor moves
   *  away, so items glide back instead of snapping. */
  pushLagNear: 1.1,
  pushLagFar: 2,
  /** Scroll scrub: yPercent sweeps from depth * enter to -depth * exit,
   *  smoothed by `scrollScrub` seconds of catch-up so the field lags and
   *  rebounds fluidly instead of tracking the scrollbar 1:1. */
  scrollEnter: 36,
  scrollExit: 72,
  scrollScrub: 1.4,
} as const

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function reducedMotionQuery(): MediaQueryList {
  return window.matchMedia(REDUCED_MOTION_QUERY)
}

export function prefersReducedMotion(): boolean {
  return reducedMotionQuery().matches
}
