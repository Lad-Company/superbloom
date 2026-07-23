import gsap from 'gsap';
import { EASE, MOTION, prefersReducedMotion } from './config';

const ENTERING_CLASS = 'route-entering';
const FLAG_KEY = 'sbh:route-transition';

export const ROUTE_REVEALED_EVENT = 'motion:route-revealed';

export interface RouteTransitionOptions {
  /** Selector for links that should trigger a full-viewport Route Transition. */
  linkSelector?: string;
}

function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented
  );
}

export function initRouteTransition(overlay: HTMLElement, options: RouteTransitionOptions = {}): () => void {
  const { linkSelector = '[data-route-link]' } = options;
  const root = document.documentElement;

  const finishReveal = () => {
    root.classList.remove(ENTERING_CLASS);
    document.dispatchEvent(new CustomEvent(ROUTE_REVEALED_EVENT));
  };

  if (prefersReducedMotion()) {
    root.classList.remove(ENTERING_CLASS);
    gsap.set(overlay, { yPercent: 100 });
    finishReveal();
    return () => {};
  }

  const entering = root.classList.contains(ENTERING_CLASS) || sessionStorage.getItem(FLAG_KEY) === '1';
  sessionStorage.removeItem(FLAG_KEY);

  if (entering) {
    gsap.set(overlay, { yPercent: 0 });
    gsap.to(overlay, {
      yPercent: -100,
      duration: MOTION.deliberate,
      ease: EASE.inOut,
      onComplete: finishReveal,
    });
  } else {
    gsap.set(overlay, { yPercent: 100 });
    finishReveal();
  }

  const links = [...document.querySelectorAll<HTMLAnchorElement>(linkSelector)];

  const handleClick = (event: MouseEvent) => {
    if (!isPlainLeftClick(event)) return;
    const link = event.currentTarget as HTMLAnchorElement;
    const href = link.href;
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname) return;

    event.preventDefault();
    sessionStorage.setItem(FLAG_KEY, '1');
    gsap.set(overlay, { yPercent: 100 });
    gsap.to(overlay, {
      yPercent: 0,
      duration: MOTION.deliberate,
      ease: EASE.inOut,
      onComplete: () => {
        window.location.assign(href);
      },
    });
  };

  for (const link of links) {
    link.addEventListener('click', handleClick);
  }

  return () => {
    for (const link of links) link.removeEventListener('click', handleClick);
  };
}
