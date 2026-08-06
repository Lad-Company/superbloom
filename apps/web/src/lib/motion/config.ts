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
  snap: 'back.out(1.4)',
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

export const POINTER_FOLLOW = {
  baseLag: 0.18,
  lagStep: 0.14,
  fanRadius: 90,
  fanRadiusStep: 70,
  restingSpread: 0.18,
  edgeDampZone: 32,
  springDampingRatio: 0.82,
} as const

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function reducedMotionQuery(): MediaQueryList {
  return window.matchMedia(REDUCED_MOTION_QUERY)
}

export function prefersReducedMotion(): boolean {
  return reducedMotionQuery().matches
}
