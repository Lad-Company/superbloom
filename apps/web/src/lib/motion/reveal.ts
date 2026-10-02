import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {EASE, MOTION, STAGGER, prefersReducedMotion} from './config'
import {splitText, type SplitHandle, type SplitUnit} from './splitText'

gsap.registerPlugin(ScrollTrigger)

export interface RevealOptions {
  /** Split unit that gets animated. Reading copy defaults to lines. */
  unit?: SplitUnit
  /** Play on scroll into view rather than immediately. */
  scroll?: boolean
  /** ScrollTrigger start, only used when `scroll` is true. */
  start?: string
  stagger?: number
  duration?: number
  delay?: number
  /** Vertical release distance in px. */
  y?: number
}

export interface RevealHandle {
  play: () => void
  destroy: () => void
}

const noopHandle: RevealHandle = {play() {}, destroy() {}}

/** First-load veil state: the loader element carries data-loader-done from
 *  the moment Layout lifts it. Page-entry reveals (scroll: false) hold their
 *  play until the lift so the Type Reveal still opens on a clean frame — but
 *  the split itself runs as soon as the motion chunk lands, so the veil's
 *  media wait never gates the heading's first paint (motion.css keeps
 *  page-entry targets visible to LCP under the veil). */
const veilOpen = (): boolean =>
  typeof document !== 'undefined' &&
  Boolean(document.querySelector('[data-page-loader]:not([data-loader-done])'))

let pageEntryHasRevealed = false

export function hasPageEntryRevealed(): boolean {
  return pageEntryHasRevealed
}

export function markPageEntryRevealed(): void {
  pageEntryHasRevealed = true
}

export function pageEntryRevealAllowed(state: {
  reducedMotion: boolean
  alreadyRevealed: boolean
  routeEntering: boolean
}): boolean {
  if (state.reducedMotion) return true
  if (state.alreadyRevealed) return false
  return !state.routeEntering
}

/** Returns true when the initial page-entry reveal should play. */
export function shouldPlayPageEntryReveal(): boolean {
  return pageEntryRevealAllowed({
    reducedMotion: prefersReducedMotion(),
    alreadyRevealed: pageEntryHasRevealed,
    routeEntering:
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('route-entering'),
  })
}

/**
 * Type Reveal primitive. Clips animated units upward into place fast and lands
 * them on a slight overshoot settle — no opacity fade — so entrances spring
 * into place like the Surface Wipe control hover rather than smacking to a
 * stop. Under reduced motion the element is left in its final visible state.
 */
export async function revealText(
  el: HTMLElement,
  options: RevealOptions = {},
): Promise<RevealHandle> {
  const {
    unit = 'lines',
    scroll = false,
    start = 'top 80%',
    stagger = unit === 'chars' ? STAGGER.tight : STAGGER.standard,
    duration = MOTION.quick,
    delay = 0,
    y = unit === 'chars' ? 18 : undefined,
  } = options

  if (prefersReducedMotion()) {
    el.style.opacity = '1'
    return noopHandle
  }

  const units: SplitUnit[] =
    unit === 'lines'
      ? ['lines']
      : unit === 'words'
        ? ['lines', 'words']
        : ['lines', 'words', 'chars']

  let split: SplitHandle
  try {
    split = await splitText(el, units, () => build())
  } catch {
    el.style.opacity = '1'
    return noopHandle
  }

  // Wrap line hosts so animated units can translate under an overflow clip.
  // The padding/margin pair lifts the clip edge 0.1em above the line box
  // without shifting layout, so the overshoot settle never clips ascenders.
  for (const line of split.targets('lines')) {
    line.style.overflow = 'clip'
    line.style.display = 'block'
    line.style.paddingTop = '0.1em'
    line.style.marginTop = '-0.1em'
  }

  let tween: gsap.core.Tween | null = null
  let trigger: ScrollTrigger | null = null
  let veilPlayListener: (() => void) | null = null
  // Once the entrance has been started (immediate or scroll-triggered),
  // resize must never replay it. From that point, `build` only re-lays the
  // new split units in the visible end-state instead of rebuilding a paused
  // fromTo that would immediately re-hide them.
  let hasStarted = false

  const build = () => {
    tween?.kill()
    const targets = split.targets(unit)
    for (const target of targets) {
      target.style.display = 'inline-block'
    }
    if (hasStarted) {
      // Commit the end-state directly so the entrance never replays.
      gsap.set(targets, {
        yPercent: 0,
        y: 0,
      })
      tween = null
      return
    }
    for (const target of targets) target.style.willChange = 'transform'
    const fromVars: gsap.TweenVars = {
      yPercent: unit === 'lines' ? 110 : 100,
    }
    if (y !== undefined) fromVars.y = y
    tween = gsap.fromTo(targets, fromVars, {
      yPercent: 0,
      y: 0,
      duration,
      delay,
      ease: EASE.snap,
      stagger,
      paused: true,
      onComplete: () => {
        for (const target of targets) target.style.willChange = 'auto'
      },
    })
  }

  build()
  el.style.opacity = '1'

  const play = () => {
    hasStarted = true
    // If a resize already short-circuited the tween (hasStarted was true
    // before play), there is nothing to replay.
    tween?.restart(true)
  }

  if (scroll) {
    trigger = ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: play,
    })
  } else if (veilOpen()) {
    // First load: the heading painted under the veil (the motion.css LCP
    // exception) and the split has just re-hidden it behind the line clips.
    // Hold the reveal until Layout lifts the veil so it plays on a clean
    // frame — the veil's media wait gates the animation, never the paint.
    veilPlayListener = () => play()
    document.addEventListener('sbh:veil-lifted', veilPlayListener, { once: true })
  } else if (!document.documentElement.hasAttribute('data-veil-skip')) {
    // First load, but the veil lifted before the split landed (very slow
    // motion chunk): the heading has been visibly painted the whole time, so
    // hiding it now for a late reveal would read as a glitch. Commit the end
    // state instead — hasStarted makes build() lay out the visible end-state.
    hasStarted = true
    build()
  } else {
    // Veil-skip reloads and View Transition navigations (both stamp
    // data-veil-skip): the CSS opacity gate kept the heading hidden, so the
    // reveal plays as soon as the split is ready, as before.
    play()
  }

  return {
    play,
    destroy() {
      if (veilPlayListener) {
        document.removeEventListener('sbh:veil-lifted', veilPlayListener)
        veilPlayListener = null
      }
      trigger?.kill()
      tween?.kill()
      split.revert()
    },
  }
}
