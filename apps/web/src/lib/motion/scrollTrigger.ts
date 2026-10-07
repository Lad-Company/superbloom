import gsap from 'gsap';

type ScrollTriggerPlugin = (typeof import('gsap/ScrollTrigger'))['ScrollTrigger'];

let loading: Promise<ScrollTriggerPlugin> | null = null;

/**
 * ScrollTrigger rides a dynamic import so its chunk stays off the critical
 * path: the page-entry Type Reveal (gsap core + split-type only) plays
 * immediately, and scroll-driven systems pull the plugin on demand — reveals
 * as they arm, heavier systems at the Layout's deferred-motion idle beat.
 * Registers with gsap exactly once; every caller shares the same promise.
 */
export function loadScrollTrigger(): Promise<ScrollTriggerPlugin> {
  loading ??= import('gsap/ScrollTrigger').then((mod) => {
    gsap.registerPlugin(mod.ScrollTrigger);
    return mod.ScrollTrigger;
  });
  return loading;
}
