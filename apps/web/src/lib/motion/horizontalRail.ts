import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from './smoothScroll';

gsap.registerPlugin(ScrollTrigger);

export interface HorizontalRailHandle {
  previous: () => void;
  next: () => void;
  destroy: () => void;
}

export function initHorizontalRail(section: HTMLElement, rail: HTMLElement, track: HTMLElement): HorizontalRailHandle {
  let trigger: ScrollTrigger | null = null;
  const mm = gsap.matchMedia();

  const scrollToProgress = (direction: -1 | 1) => {
    if (!trigger) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const cardWidth = cards[0]?.offsetWidth ?? rail.clientWidth;
    const overflow = Math.max(0, track.scrollWidth - rail.clientWidth);
    const nextProgress = gsap.utils.clamp(0, 1, trigger.progress + (cardWidth / Math.max(overflow, 1)) * direction);
    const position = trigger.start + (trigger.end - trigger.start) * nextProgress;
    const lenis = getLenis();

    if (lenis) {
      lenis.scrollTo(position);
    } else {
      window.scrollTo({ top: position, behavior: 'smooth' });
    }
  };

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-scroll-jacked');
    const tween = gsap.to(track, {
      x: () => -Math.max(0, track.scrollWidth - rail.clientWidth),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.max(1, track.scrollWidth - rail.clientWidth)}`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    trigger = tween.scrollTrigger ?? null;

    return () => {
      section.classList.remove('is-scroll-jacked');
      trigger = null;
      tween.kill();
    };
  });

  return {
    previous: () => scrollToProgress(-1),
    next: () => scrollToProgress(1),
    destroy: () => mm.revert(),
  };
}
