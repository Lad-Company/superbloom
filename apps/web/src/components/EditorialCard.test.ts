import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./EditorialCard.astro', import.meta.url), 'utf8')

describe('Editorial Card', () => {
  it('uses the Figma card-title typography', () => {
    expect(source).toContain('font-family: var(--font-body)')
    expect(source).toContain('font-size: 24px')
    expect(source).toContain('font-weight: 500')
    expect(source).toContain('line-height: 1.2')
    expect(source).toContain('letter-spacing: -0.02em')
  })
})
