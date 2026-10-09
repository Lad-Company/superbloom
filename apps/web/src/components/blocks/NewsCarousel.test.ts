import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./NewsCarousel.astro', import.meta.url), 'utf8')

describe('News Carousel', () => {
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

  it('applies CMS item overrides to cards by article id', () => {
    expect(source).toContain('itemOverrides?.map((override) => [override.articleId, override])')
    expect(source).toContain('settings={overrides.get(item._id)}')
  })
})
