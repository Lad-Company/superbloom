import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./CardCarousel.astro', import.meta.url), 'utf8')

describe('Card Carousel', () => {
  it('uses native horizontal browsing with progressive arrow controls', () => {
    expect(source).toContain('overflow-x: auto')
    expect(source).toContain('scroll-snap-type: x proximity')
    expect(source).toContain('scrollbar-width: none')
    expect(source).toContain('.track::-webkit-scrollbar')
    expect(source).toContain('tabindex="0"')
    expect(source).toContain('scrollBy')
    expect(source).toContain("this.dataset.enhanced = 'true'")
    expect(source).toContain('card-carousel:not([data-enhanced]) .controls')
  })

  it('sizes cards through the shared Content Card contract', () => {
    expect(source).toContain("data-card-width='1/3'")
    expect(source).not.toContain('.featured')
    expect(source).not.toContain('.standard')
  })

  it('keeps cards narrow on mobile', () => {
    expect(source).toContain('width: min(76vw, 280px)')
  })
})
