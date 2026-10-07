import gsap from 'gsap'
import type {ScrollTrigger} from 'gsap/ScrollTrigger'
import {EASE, MOTION, STAGGER, prefersReducedMotion} from './config'
import {loadScrollTrigger} from './scrollTrigger'
import {splitText, type SplitHandle, type SplitUnit} from './splitText'

export interface RevealOptions {
  /** Split unit that gets animated. Reading copy defaults to lines. The hero
   *  heading's entry reveal is not a caller: it is SSR word-split and
   *  CSS-animated (HeroHeading.astro) so no JS ever rebuilds the LCP
   *  element after paint (ARCHITECTURE.md ADR-0040). */
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
    stagger = STAGGER.standard,
    duration = MOTION.quick,
    delay = 0,
    y,
  } = options

  if (prefersReducedMotion()) {
    el.style.opacity = '1'
    return noopHandle
  }

  const units: SplitUnit[] = unit === 'lines' ? ['lines'] : ['lines', 'words']

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

  // Scroll-triggered reveals arm on the lazily loaded ScrollTrigger chunk.
  // The element is already visible (opacity 1 above; units sit in their
  // clipped from-state), so a swap before the chunk lands must cancel the
  // arming rather than create a trigger on a detached subtree.
  let destroyed = false

  if (scroll) {
    void loadScrollTrigger().then((ScrollTrigger) => {
      if (destroyed) return
      trigger = ScrollTrigger.create({
        trigger: el,
        start,
        once: true,
        onEnter: play,
      })
    })
  } else {
    // Immediate reveals (MotionText with scroll=false): the CSS opacity gate
    // kept the element hidden until the split landed, so play right away.
    play()
  }

  return {
    play,
    destroy() {
      destroyed = true
      trigger?.kill()
      tween?.kill()
      split.revert()
    },
  }
}
