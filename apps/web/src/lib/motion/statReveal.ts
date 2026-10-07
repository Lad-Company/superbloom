import gsap from 'gsap'
import {EASE, MOTION, STAGGER, prefersReducedMotion} from './config'
import {loadScrollTrigger} from './scrollTrigger'

/**
 * Stat Reveal primitive. Items rise into place fast with a slight overshoot
 * settle — no opacity fade — when the container scrolls into view, and any
 * numeric `.value` inside an item counts up from zero at a constant linear
 * rate (decimal precision and suffix preserved). Shared by the Who We Are
 * fact cards and the Case Study Results stats. Under reduced motion
 * nothing is hidden and no timeline runs.
 *
 * Pass `entrance: false` to skip the rise-in movement and keep only the
 * count-up (Who We Are fact cards sit static; the stats still animate).
 *
 * Triggers arm on the lazily loaded ScrollTrigger chunk; values are zeroed
 * synchronously so the SSR'd final value never flashes before arming.
 *
 * Returns a cleanup that kills the triggers/tweens; wire it to
 * `astro:before-swap`. Triggers are `once`, so they self-kill after firing.
 */
export function revealStats(
  container: HTMLElement,
  itemSelector: string,
  options: {entrance?: boolean} = {},
): () => void {
  if (prefersReducedMotion()) return () => {}

  const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector))
  if (!items.length) return () => {}

  // Parse and zero the counters synchronously so the scroll-in reads as a
  // count-up rather than the SSR'd final value snapping to 0 when the
  // trigger fires.
  const counters = items.flatMap((item) => {
    const valueEl = item.querySelector<HTMLElement>('.value')
    if (!valueEl) return []

    const raw = valueEl.textContent?.trim() ?? ''
    const match = raw.match(/^(\d+(?:\.\d+)?)(.*)$/)
    if (!match) return []

    const target = parseFloat(match[1])
    const decimals = match[1].includes('.') ? (match[1].split('.')[1] ?? '').length : 0
    const suffix = match[2] ?? ''

    valueEl.textContent = `${(0).toFixed(decimals)}${suffix}`
    return [{item, valueEl, target, decimals, suffix}]
  })

  let destroyed = false
  let entrance: gsap.core.Tween | null = null
  const counterTweens: gsap.core.Tween[] = []

  void loadScrollTrigger().then(() => {
    if (destroyed) return

    entrance =
      options.entrance === false
        ? null
        : gsap.fromTo(
            items,
            {y: 40},
            {
              y: 0,
              duration: MOTION.quick,
              stagger: STAGGER.standard,
              ease: EASE.snap,
              scrollTrigger: {trigger: container, start: 'top 80%', once: true},
            },
          )

    for (const {item, valueEl, target, decimals, suffix} of counters) {
      const counter = {val: 0}
      counterTweens.push(
        gsap.to(counter, {
          val: target,
          duration: MOTION.deliberate,
          ease: EASE.linear,
          onUpdate() {
            valueEl.textContent = `${counter.val.toFixed(decimals)}${suffix}`
          },
          scrollTrigger: {trigger: item, start: 'top 80%', once: true},
        }),
      )
    }
  })

  return () => {
    destroyed = true
    entrance?.scrollTrigger?.kill()
    entrance?.kill()
    counterTweens.forEach((tween) => {
      tween.scrollTrigger?.kill()
      tween.kill()
    })
  }
}
