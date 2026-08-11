import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {isPreviewMode} from './config'

gsap.registerPlugin(ScrollTrigger)

export function initDepthLayer(scope: HTMLElement): () => void {
  const layers = Array.from(scope.querySelectorAll<HTMLElement>('[data-depth]')).slice(0, 3)
  if (!layers.length) return () => {}
  // Preview mode renders layers in their final, natural position.
  if (isPreviewMode()) return () => {}

  const mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tweens = layers.map((layer) => {
      const depth = Math.min(1, Math.max(0, Number(layer.dataset.depth ?? 0)))
      return gsap.fromTo(
        layer,
        {yPercent: depth * 24},
        {
          yPercent: -depth * 48,
          ease: 'none',
          scrollTrigger: {
            trigger: scope,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      )
    })

    return () => tweens.forEach((tween) => tween.kill())
  })

  return () => mm.revert()
}
