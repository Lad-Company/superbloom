import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./CardCarousel.astro', import.meta.url), 'utf8')
const railCss = readFileSync(new URL('../styles/contentCardRail.css', import.meta.url), 'utf8')

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

  it('supports scroll jacking and reduced motion fallback', () => {
    expect(source).toContain('initHorizontalRail')
    expect(source).toContain("this.classList.contains('is-scroll-jacked')")
  })

  it('allows opting out of scroll jacking via the scrollJack prop', () => {
    expect(source).toContain('scrollJack?: boolean')
    expect(source).toContain("data-scroll-jack={scrollJack ? 'true' : 'false'}")
    expect(source).toContain("this.dataset.scrollJack !== 'false'")
  })

  it('accepts optional button props', () => {
    expect(source).toContain('buttonProps')
    expect(source).toContain('previousButtonProps')
    expect(source).toContain('nextButtonProps')
  })

  it('sizes cards through the shared Content Card rail contract', () => {
    expect(source).toContain("import '../styles/contentCardRail.css'")
    expect(railCss).toContain("data-card-width='1/3'")
    // Rail widths are literal viewport fractions: 1/3 of the viewport = 33.33vw.
    expect(railCss).toContain('width: 33.33vw')
    expect(railCss).toContain('width: 50vw')
    expect(source).not.toContain('.featured')
    expect(source).not.toContain('.standard')
  })

  it('keeps cards narrow on mobile', () => {
    expect(railCss).toContain('width: min(56vw, 360px)')
    expect(railCss).toContain('width: min(76vw, 280px)')
  })
})
