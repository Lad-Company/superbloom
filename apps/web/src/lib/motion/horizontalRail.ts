import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from './smoothScroll';
import { SCROLL } from './config';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollDrivenTrackOptions {
  trigger: HTMLElement;
  viewport: HTMLElement;
  track: HTMLElement;
  getX?: () => number;
  start?: string;
  end?: string | (() => string);
}

export interface ScrollDrivenTrackHandle {
  getProgress: () => number;
  scrollToProgress: (progress: number) => void;
  destroy: () => void;
}

export interface HorizontalRailHandle {
  previous: () => void;
  next: () => void;
  destroy: () => void;
}

export function initScrollDrivenTrack({
  trigger: triggerElement,
  viewport,
  track,
  getX = () => -Math.max(0, track.scrollWidth - viewport.clientWidth),
  start = 'top bottom',
  end = 'bottom top',
}: ScrollDrivenTrackOptions): ScrollDrivenTrackHandle {
  let trigger: ScrollTrigger | null = null;
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tween = gsap.to(track, {
      x: getX,
      ease: 'none',
      scrollTrigger: {
        trigger: triggerElement,
        start,
        end,
        scrub: SCROLL.scrubLag,
        invalidateOnRefresh: true,
      },
    });
    trigger = tween.scrollTrigger ?? null;

    return () => {
      trigger = null;
      tween.kill();
    };
  });

  return {
    getProgress: () => trigger?.progress ?? 0,
    scrollToProgress: (progress) => {
      if (!trigger) return;
      const position = trigger.start + (trigger.end - trigger.start) * gsap.utils.clamp(0, 1, progress);
      const lenis = getLenis();

      if (lenis) {
        lenis.scrollTo(position);
      } else {
        window.scrollTo({ top: position, behavior: 'smooth' });
      }
    },
    destroy: () => mm.revert(),
  };
}

export function initHorizontalRail(section: HTMLElement, rail: HTMLElement, track: HTMLElement): HorizontalRailHandle {
  const mm = gsap.matchMedia();
  const scrollDrivenTrack = initScrollDrivenTrack({
    trigger: section,
    viewport: rail,
    track,
  });

  const scrollToProgress = (direction: -1 | 1) => {
    const cards = Array.from(track.children) as HTMLElement[];
    const cardWidth = cards[0]?.offsetWidth ?? rail.clientWidth;
    const overflow = Math.max(0, track.scrollWidth - rail.clientWidth);
    const nextProgress = scrollDrivenTrack.getProgress() + (cardWidth / Math.max(overflow, 1)) * direction;
    scrollDrivenTrack.scrollToProgress(nextProgress);
  };

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-scroll-jacked');

    return () => {
      section.classList.remove('is-scroll-jacked');
    };
  });

  return {
    previous: () => scrollToProgress(-1),
    next: () => scrollToProgress(1),
    destroy: () => {
      scrollDrivenTrack.destroy();
      mm.revert();
    },
  };
}
