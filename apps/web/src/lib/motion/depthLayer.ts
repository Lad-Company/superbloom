import gsap from 'gsap'
import {loadScrollTrigger} from './scrollTrigger'

export function initDepthLayer(scope: HTMLElement): () => void {
  const layers = Array.from(scope.querySelectorAll<HTMLElement>('[data-depth]')).slice(0, 3)
  if (!layers.length) return () => {}

  const mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    let killed = false
    const tweens: gsap.core.Tween[] = []
    void loadScrollTrigger().then(() => {
      if (killed) return
      tweens.push(
        ...layers.map((layer) => {
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
        }),
      )
    })

    return () => {
      killed = true
      tweens.forEach((tween) => tween.kill())
    }
  })

  return () => mm.revert()
}
