import SplitType from 'split-type';

export type SplitUnit = 'lines' | 'words' | 'chars';

export interface SplitHandle {
  instance: SplitType;
  targets: (units: SplitUnit) => HTMLElement[];
  revert: () => void;
}

const UNIT_MAP: Record<SplitUnit, keyof Pick<SplitType, 'lines' | 'words' | 'chars'>> = {
  lines: 'lines',
  words: 'words',
  chars: 'chars',
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
    await document.fonts.ready;
  }

  let instance = new SplitType(el, { types: units, tagName: 'span' });

  let resizeRaf = 0;
  let lastWidth = el.offsetWidth;
  const handleResize = () => {
    if (el.offsetWidth === lastWidth) return;
    lastWidth = el.offsetWidth;
    window.cancelAnimationFrame(resizeRaf);
    resizeRaf = window.requestAnimationFrame(() => {
      instance.revert();
      instance = new SplitType(el, { types: units, tagName: 'span' });
      onResplit?.();
    });
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
