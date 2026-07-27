import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./WhoWeAreAdvantages.astro', import.meta.url), 'utf8')

describe('Who We Are Advantages', () => {
  it('uses the Figma 3:2 media ratio without constraining it to slide height', () => {
    expect(source).toContain('ratio="3:2"')
    expect(source).not.toContain('.advantages-section.is-jacked .item-media')
    expect(source).not.toContain('.advantages-section.is-jacked .item-media :global(.media-frame)')
  })
})
