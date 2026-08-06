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
 * Type Reveal primitive. Clips animated units upward into place at a constant
 * linear speed — no opacity fade, no eased float — so entrances read with the
 * same snap as the Surface Wipe control hover. Under reduced motion the
 * element is left in its final visible state.
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
    duration = unit === 'chars' ? MOTION.standard : MOTION.quick,
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
  for (const line of split.targets('lines')) {
    line.style.overflow = 'clip'
    line.style.display = 'block'
  }

  let tween: gsap.core.Tween | null = null
  let trigger: ScrollTrigger | null = null
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
      ease: EASE.linear,
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
  } else {
    play()
  }

  return {
    play,
    destroy() {
      trigger?.kill()
      tween?.kill()
      split.revert()
    },
  }
}
