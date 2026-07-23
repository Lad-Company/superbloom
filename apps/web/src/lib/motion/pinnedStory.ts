import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './config';

gsap.registerPlugin(ScrollTrigger);

export interface PinnedStoryOptions {
  /** The scroll region that scrubs through chapters. */
  section: HTMLElement;
  /** The element pinned within the section (not the whole document). */
  pin: HTMLElement;
  /** Number of narrative chapters. The language allows two to four. */
  chapters: number;
  /** Called with the active chapter index as the region scrubs. */
  onChapter: (index: number) => void;
  /** Scroll length per chapter as a percentage of viewport height. */
  chapterScroll?: number;
}

/**
 * Pinned Storytelling primitive. Pins a bounded region and scrubs linearly
 * through a small set of chapters. Under reduced motion no pin is created and
 * the first chapter is shown in normal document flow.
 */
export function initPinnedStory(options: PinnedStoryOptions): () => void {
  const { section, pin, chapters, onChapter, chapterScroll = 100 } = options;

  if (chapters < 2) {
    onChapter(0);
    return () => {};
  }
  if (chapters > 4 && import.meta.env?.DEV) {
    console.warn(`[pinnedStory] ${chapters} chapters exceeds the recommended maximum of four.`);
  }

  onChapter(0);

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${chapters * chapterScroll}%`,
      pin,
      scrub: true,
      onUpdate: (self) => {
        const index = Math.min(chapters - 1, Math.floor(self.progress * chapters));
        onChapter(index);
      },
    });
    return () => trigger.kill();
  });

  return () => mm.revert();
}

export { prefersReducedMotion };
