import {initPressFeedback} from './hover'
import {revealText, type RevealHandle} from './reveal'

/**
 * Per-page motion bootstrap. Wires Contained Control press feedback and the
 * Type Reveal entry animation for every element that opts in via data
 * attributes, then returns a cleanup for the caller to run on `astro:before-swap`.
 *
 * Runs on every `astro:page-load`. On the genuine initial load it plays the
 * full page-entry Type Reveal (hero/immediate + scroll). On View Transition
 * navigations the native swipe carries the entrance, so only scroll-triggered
 * reveals are wired and the immediate hero/text elements are left visible (the
 * `html.js` hide rule no longer applies once Astro resets the root on swap).
 */
export function initMotion(isInitialLoad = true): () => void {
  const cleanups: Array<() => void> = [initPressFeedback()]
  const handles: RevealHandle[] = []

  const reveal = (el: HTMLElement) => {
    if (el.dataset.motionInit) return
    el.dataset.motionInit = '1'
    revealText(el, {
      unit: (el.dataset.unit as 'lines' | 'words' | 'chars') || 'lines',
      scroll: el.dataset.scroll !== 'false',
      blur: el.dataset.blur !== undefined,
      start: el.dataset.start || undefined,
    }).then((handle) => handles.push(handle))
  }

  const selector = isInitialLoad
    ? '[data-motion-text]'
    : '[data-motion-text]:not([data-scroll="false"])'
  document.querySelectorAll<HTMLElement>(selector).forEach(reveal)

  return () => {
    handles.forEach((handle) => handle.destroy())
    cleanups.forEach((cleanup) => cleanup())
  }
}
