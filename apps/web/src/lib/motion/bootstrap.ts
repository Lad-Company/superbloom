import {initPressFeedback} from './hover'
import {revealText, type RevealHandle} from './reveal'

/**
 * Per-page motion bootstrap. Wires Contained Control press feedback and the
 * Type Reveal entry animation for every element that opts in via data
 * attributes, then returns a cleanup for the caller to run on `astro:before-swap`.
 *
 * Runs on every `astro:page-load`. The full Type Reveal (immediate hero +
 * scroll-triggered) plays on the genuine initial load and on every View
 * Transition navigation — Layout stamps the incoming document with the `js`
 * class on `astro:before-swap`, so reveal targets start hidden and animate in
 * alongside the route swipe.
 */
export function initMotion(): () => void {
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

  document.querySelectorAll<HTMLElement>('[data-motion-text]').forEach(reveal)

  return () => {
    handles.forEach((handle) => handle.destroy())
    cleanups.forEach((cleanup) => cleanup())
  }
}
