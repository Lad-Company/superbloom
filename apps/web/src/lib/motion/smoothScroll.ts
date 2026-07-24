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
    lenis?.destroy();
    lenis = null;
    if (previousScrollRestoration !== null) history.scrollRestoration = previousScrollRestoration;
  };
}

export function getLenis(): Lenis | null {
  return lenis;
}
