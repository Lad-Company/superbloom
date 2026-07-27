import {initPressFeedback} from './hover'
import {
  revealText,
  type RevealHandle,
  markPageEntryRevealed,
  shouldPlayPageEntryReveal,
} from './reveal'
import {ROUTE_REVEALED_EVENT} from './routeTransition'

/**
 * Single per-page motion bootstrap. Wires Contained Control press feedback and
 * Type Reveal for every element that opts in via data attributes.
 *
 * The full page-entry fade-up plays once per genuine page load. Route
 * navigations (signalled by the `route-entering` class in Layout.astro) skip
 * the initial page-entry reveal and rely on the Route Transition; only the
 * destination hero (immediate) elements are revealed after the transition panel
 * lifts. Scroll-triggered reveals are always wired so they remain active.
 */
export function initMotion(): void {
  initPressFeedback()

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

  const revealAllScroll = () => {
    document
      .querySelectorAll<HTMLElement>('[data-motion-text]:not([data-scroll="false"])')
      .forEach(reveal)
  }

  const revealAllImmediate = () => {
    document
      .querySelectorAll<HTMLElement>('[data-motion-text][data-scroll="false"]')
      .forEach(reveal)
  }

  // Always wire scroll-triggered reveals so they remain active during route transitions.
  revealAllScroll()

  // Play the full page-entry reveal only on genuine loads; route navigations use
  // the Route Transition instead. Under reduced motion, content is made visible
  // immediately, so the reveal path still runs to set final opacity.
  if (shouldPlayPageEntryReveal()) {
    revealAllImmediate()
    markPageEntryRevealed()
  }

  // After a Route Transition panel lifts, reveal the destination hero elements.
  document.addEventListener(ROUTE_REVEALED_EVENT, revealAllImmediate)

  window.addEventListener('pagehide', () => {
    handles.forEach((handle) => handle.destroy())
  })
}
