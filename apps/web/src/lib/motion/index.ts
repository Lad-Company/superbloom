// Client-only barrel: several modules below top-level-import gsap, so this
// file must never be imported from Astro frontmatter — it would pull gsap
// into the SSR server graph and 500 the Vercel function at module load.
// Frontmatter that needs motion constants imports from './config' directly.
// CI enforces this via `pnpm --filter web check:ssr` (scripts/check-ssr-imports.mjs).
export { MOTION, EASE, STAGGER, SCROLL, POINTER, PARALLAX_FIELD, REDUCED_MOTION_QUERY, reducedMotionQuery, prefersReducedMotion } from './config';
export { splitText, type SplitHandle, type SplitUnit } from './splitText';
export { revealText, type RevealOptions, type RevealHandle } from './reveal';
export { revealStats } from './statReveal';
export { initPressFeedback } from './hover';
export { LoadingSurface, type LoadingPhase, type LoadingSurfaceOptions } from './loading';
export { initPinnedStory, type PinnedStoryOptions } from './pinnedStory';
export { initSmoothScroll, getLenis } from './smoothScroll';
export { initDepthLayer } from './depthLayer';
export {
  initHorizontalRail,
  initScrollDrivenTrack,
  type HorizontalRailHandle,
  type ScrollDrivenTrackHandle,
  type ScrollDrivenTrackOptions,
} from './horizontalRail';
export { initMotion } from './bootstrap';
