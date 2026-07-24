import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./NewsCarousel.astro', import.meta.url), 'utf8')

describe('News Carousel', () => {
  it('keeps the carousel header and controls within the page gutter', () => {
    expect(source).toContain('padding: var(--space-2xl) var(--page-inset)')
    expect(source).toContain('padding-inline: 12px')
  })
})
