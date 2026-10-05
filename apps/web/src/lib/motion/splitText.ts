import SplitType from 'split-type';

export type SplitUnit = 'lines' | 'words';

export interface SplitHandle {
  instance: SplitType;
  targets: (units: SplitUnit) => HTMLElement[];
  revert: () => void;
}

const UNIT_MAP: Record<SplitUnit, keyof Pick<SplitType, 'lines' | 'words'>> = {
  lines: 'lines',
  words: 'words',
};

/**
 * Split an element after fonts have loaded, re-splitting on resize so line
 * wrappers stay accurate. Callers must invoke the returned `revert` on teardown.
 */
export async function splitText(
  el: HTMLElement,
  units: SplitUnit[],
  onResplit?: () => void,
): Promise<SplitHandle> {
  if (document.fonts?.ready) {
    // Split once webfonts are in so line wrapping is accurate, but never let a
    // slow font load hold the heading blank — reveal after a short cap either
    // way (a fallback re-split on resize corrects any late reflow).
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => window.setTimeout(resolve, 200)),
    ]);
  }

  let instance = new SplitType(el, { types: units, tagName: 'span' });

  let resizeRaf = 0;
  let lastWidth = el.offsetWidth;
  const scheduleResplit = () => {
    window.cancelAnimationFrame(resizeRaf);
    resizeRaf = window.requestAnimationFrame(() => {
      instance.revert();
      instance = new SplitType(el, { types: units, tagName: 'span' });
      onResplit?.();
    });
  };
  const handleResize = () => {
    if (el.offsetWidth === lastWidth) return;
    lastWidth = el.offsetWidth;
    scheduleResplit();
  };

  window.addEventListener('resize', handleResize);

  return {
    get instance() {
      return instance;
    },
    targets(unit: SplitUnit) {
      return (instance[UNIT_MAP[unit]] ?? []) as HTMLElement[];
    },
    revert() {
      window.cancelAnimationFrame(resizeRaf);
      window.removeEventListener('resize', handleResize);
      instance.revert();
    },
  } as SplitHandle;
}
