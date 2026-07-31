import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {EASE, MOTION, STAGGER, prefersReducedMotion} from './config'

gsap.registerPlugin(ScrollTrigger)

/**
 * Stat Reveal primitive. Items fade and rise with a standard stagger when the
 * container scrolls into view, and any numeric `.value` inside an item counts
 * up from zero (decimal precision and suffix preserved). Shared by the Who We
 * Are fact cards and the Case Study Results stats. Under reduced motion
 * nothing is hidden and no timeline runs.
 *
 * Returns a cleanup that kills the triggers/tweens; wire it to
 * `astro:before-swap`. Triggers are `once`, so they self-kill after firing.
 */
export function revealStats(container: HTMLElement, itemSelector: string): () => void {
  if (prefersReducedMotion()) return () => {}

  const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector))
  if (!items.length) return () => {}

  const entrance = gsap.fromTo(
    items,
    {autoAlpha: 0, y: 40},
    {
      autoAlpha: 1,
      y: 0,
      duration: MOTION.standard,
      stagger: STAGGER.standard,
      ease: EASE.out,
      scrollTrigger: {trigger: container, start: 'top 80%', once: true},
    },
  )

  const counters: gsap.core.Tween[] = []
  items.forEach((item) => {
    const valueEl = item.querySelector<HTMLElement>('.value')
    if (!valueEl) return

    const raw = valueEl.textContent?.trim() ?? ''
    const match = raw.match(/^(\d+(?:\.\d+)?)(.*)$/)
    if (!match) return

    const target = parseFloat(match[1])
    const decimals = match[1].includes('.') ? (match[1].split('.')[1] ?? '').length : 0
    const suffix = match[2] ?? ''
    const counter = {val: 0}

    counters.push(
      gsap.to(counter, {
        val: target,
        duration: MOTION.chapter,
        ease: EASE.out,
        onUpdate() {
          valueEl.textContent = `${counter.val.toFixed(decimals)}${suffix}`
        },
        scrollTrigger: {trigger: item, start: 'top 80%', once: true},
      }),
    )
  })

  return () => {
    entrance.scrollTrigger?.kill()
    entrance.kill()
    counters.forEach((tween) => {
      tween.scrollTrigger?.kill()
      tween.kill()
    })
  }
}
