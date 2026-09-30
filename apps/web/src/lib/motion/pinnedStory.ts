import gsap from 'gsap';
import type {ScrollTrigger} from 'gsap/ScrollTrigger';
import {prefersReducedMotion, SCROLL} from './config';
import {loadScrollTrigger} from './scrollTrigger';

export interface PinnedStoryOptions {
  /** The scroll region that scrubs through chapters. */
  section: HTMLElement;
  /** The element pinned within the section (not the whole document). */
  pin: HTMLElement;
  /** Number of narrative chapters. */
  chapters: number;
  /** Called with the active chapter index as the region scrubs. */
  onChapter: (index: number) => void;
  /** Scroll length per chapter as a percentage of viewport height. */
  chapterScroll?: number;
  /** GSAP scrub value — true for direct, number for lag in seconds. */
  scrub?: boolean | number;
}

/**
 * Pinned Storytelling primitive. Pins a bounded region and scrubs linearly
 * through a small set of chapters. Under reduced motion no pin is created and
 * the first chapter is shown in normal document flow.
 *
 * The pin arms on the lazily loaded ScrollTrigger chunk (this primitive only
 * runs from the Layout's deferred-motion beat, so the chunk is typically
 * already in flight or loaded).
 */
export function initPinnedStory(options: PinnedStoryOptions): () => void {
  const { section, pin, chapters, onChapter, chapterScroll = 100, scrub = SCROLL.scrubLag } = options;

  if (chapters < 2) {
    onChapter(0);
    return () => {};
  }
  onChapter(0);

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    let killed = false;
    let trigger: ScrollTrigger | null = null;
    void loadScrollTrigger().then((ScrollTrigger) => {
      if (killed) return;
      trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: `+=${chapters * chapterScroll}%`,
        pin,
        scrub,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const index = Math.min(chapters - 1, Math.floor(self.progress * chapters));
          onChapter(index);
        },
      });
    });
    return () => {
      killed = true;
      trigger?.kill();
    };
  });

  return () => mm.revert();
}

export { prefersReducedMotion };
