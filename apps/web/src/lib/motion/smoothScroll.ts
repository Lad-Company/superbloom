import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { prefersReducedMotion, SCROLL } from './config';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function initSmoothScroll(): () => void {
  if (prefersReducedMotion() || lenis) return () => {};

  const previousScrollRestoration = 'scrollRestoration' in history ? history.scrollRestoration : null;
  if (previousScrollRestoration !== null) history.scrollRestoration = 'manual';

  lenis = new Lenis({ lerp: SCROLL.lerp, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);

  const raf = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  const onAnchorClick = (event: MouseEvent) => {
    // A component-level handler (e.g. the case study spine nav) may have
    // already claimed this click; whoever prevents default first wins.
    if (event.defaultPrevented) return;
    const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = anchor?.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = document.querySelector<HTMLElement>(hash);
    if (!target) return;

    event.preventDefault();
    lenis?.scrollTo(target);
  };

  document.addEventListener('click', onAnchorClick);

  return () => {
    document.removeEventListener('click', onAnchorClick);
    gsap.ticker.remove(raf);
    // Halt the smooth-scroll programmatic tween before destroy. Lenis's internal
    // GSAP tween (driven by `lenis.scrollTo`) keeps firing onUpdate after the
    // instance is otherwise torn down, and each tick calls `setScroll()` →
    // `window.scrollTo({ top: <lerp-toward-target>, behavior: 'instant' })`.
    // Without stopping it, the orphan tween keeps driving the *next* page's
    // scroll position toward the previous page's target (e.g. ~3500px into a
    // case study when the user clicked a case-study card from deep on /). The
    // post-swap scrollTo(0, 0) in the Layout + Astro's hard-reset fight it,
    // but the orphan wins and the next page boots mid-section.
    lenis?.stop();
    lenis?.destroy();
    lenis = null;
    if (previousScrollRestoration !== null) history.scrollRestoration = previousScrollRestoration;
  };
}

export function getLenis(): Lenis | null {
  return lenis;
}
