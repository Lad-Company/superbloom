import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./NewsCarousel.astro', import.meta.url), 'utf8')

describe('News Carousel', () => {
  it('keeps the section within the page gutter', () => {
    expect(source).toContain('padding: var(--space-2xl) var(--page-inset)')
    expect(source).toContain('padding-inline: 12px')
  })

  it('uses the shared Marquee for endless auto-scroll', () => {
    expect(source).toContain("import Marquee from '../Marquee.astro'")
    expect(source).toContain('<Marquee>')
  })

  it('repeats the authored set so short lists still fill the loop', () => {
    expect(source).toContain('copiesPerHalf')
    expect(source).toContain('Math.ceil(8 / items.length)')
  })

  it('hides the headline by default', () => {
    expect(source).toContain('showHeadline = false')
  })

  it('bleeds the marquee to the viewport edges, outside the page gutter', () => {
    expect(source).toContain('margin-inline: calc(-1 * var(--page-inset))')
    expect(source).toContain('margin-inline: -12px')
  })
})
