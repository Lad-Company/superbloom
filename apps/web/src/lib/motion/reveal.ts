import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EASE, MOTION, STAGGER, prefersReducedMotion } from './config';
import { splitText, type SplitHandle, type SplitUnit } from './splitText';

gsap.registerPlugin(ScrollTrigger);

export interface RevealOptions {
  /** Split unit that gets animated. Reading copy defaults to lines. */
  unit?: SplitUnit;
  /** Play on scroll into view rather than immediately. */
  scroll?: boolean;
  /** ScrollTrigger start, only used when `scroll` is true. */
  start?: string;
  stagger?: number;
  duration?: number;
  delay?: number;
  /** Vertical release distance in px. */
  y?: number;
  /** Hero-only blur-to-focus. Reserved for large display moments. */
  blur?: boolean;
}

export interface RevealHandle {
  play: () => void;
  destroy: () => void;
}

const noopHandle: RevealHandle = { play() {}, destroy() {} };

/**
 * Type Reveal primitive. Clips animated units upward into place with a decisive
 * ease-out. Under reduced motion the element is left in its final visible state.
 */
export async function revealText(el: HTMLElement, options: RevealOptions = {}): Promise<RevealHandle> {
  const {
    unit = 'lines',
    scroll = false,
    start = 'top 80%',
    stagger = unit === 'chars' ? STAGGER.tight : STAGGER.standard,
    duration = unit === 'chars' ? MOTION.deliberate : MOTION.standard,
    delay = 0,
    y = unit === 'chars' ? 18 : undefined,
    blur = false,
  } = options;

  if (prefersReducedMotion()) {
    el.style.opacity = '1';
    return noopHandle;
  }

  const units: SplitUnit[] = unit === 'lines' ? ['lines'] : unit === 'words' ? ['lines', 'words'] : ['lines', 'words', 'chars'];

  let split: SplitHandle;
  try {
    split = await splitText(el, units, () => build());
  } catch {
    el.style.opacity = '1';
    return noopHandle;
  }

  // Wrap line hosts so animated units can translate under an overflow clip.
  for (const line of split.targets('lines')) {
    line.style.overflow = 'clip';
    line.style.display = 'block';
  }

  let tween: gsap.core.Tween | null = null;
  let trigger: ScrollTrigger | null = null;

  const build = () => {
    tween?.kill();
    const targets = split.targets(unit);
    for (const target of targets) {
      target.style.display = 'inline-block';
      target.style.willChange = 'transform, opacity';
    }
    const fromVars: gsap.TweenVars = {
      yPercent: unit === 'lines' ? 110 : 100,
      autoAlpha: 0,
    };
    if (y !== undefined) fromVars.y = y;
    if (blur) fromVars.filter = 'blur(12px)';
    tween = gsap.fromTo(targets, fromVars, {
      yPercent: 0,
      y: 0,
      autoAlpha: 1,
      filter: blur ? 'blur(0px)' : undefined,
      duration,
      delay,
      ease: EASE.out,
      stagger,
      paused: true,
      onComplete: () => {
        for (const target of targets) target.style.willChange = 'auto';
      },
    });
  };

  build();
  el.style.opacity = '1';

  const play = () => tween?.restart(true);

  if (scroll) {
    trigger = ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: play,
    });
  } else {
    play();
  }

  return {
    play,
    destroy() {
      trigger?.kill();
      tween?.kill();
      split.revert();
    },
  };
}
