import { initPressFeedback } from './hover';
import { revealText, type RevealHandle } from './reveal';
import { ROUTE_REVEALED_EVENT } from './routeTransition';

/**
 * Single per-page motion bootstrap. Wires Contained Control press feedback and
 * Type Reveal for every element that opts in via data attributes, and replays
 * reveals once a Route Transition curtain lifts.
 */
export function initMotion(): void {
  initPressFeedback();

  const handles: RevealHandle[] = [];

  const revealAll = () => {
    document.querySelectorAll<HTMLElement>('[data-motion-text]').forEach(async (el) => {
      if (el.dataset.motionInit) return;
      el.dataset.motionInit = '1';
      const handle = await revealText(el, {
        unit: (el.dataset.unit as 'lines' | 'words' | 'chars') || 'lines',
        scroll: el.dataset.scroll !== 'false',
        blur: el.dataset.blur !== undefined,
        start: el.dataset.start || undefined,
      });
      handles.push(handle);
    });
  };

  revealAll();
  document.addEventListener(ROUTE_REVEALED_EVENT, revealAll);
  window.addEventListener('pagehide', () => {
    handles.forEach((handle) => handle.destroy());
  });
}
