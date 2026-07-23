export const MOTION = {
  instant: 0.12,
  quick: 0.24,
  standard: 0.48,
  deliberate: 0.8,
  chapter: 1.2,
} as const;

export const EASE = {
  out: 'power3.out',
  inOut: 'power3.inOut',
} as const;

export const STAGGER = {
  tight: 0.024,
  standard: 0.048,
} as const;

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function reducedMotionQuery(): MediaQueryList {
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

export function prefersReducedMotion(): boolean {
  return reducedMotionQuery().matches;
}
