import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./TagList.astro', import.meta.url), 'utf8')

describe('TagList hover fill', () => {
  it('opts tags into the shared Surface Wipe primitive', () => {
    expect(source).toContain('tag type-label surface-wipe')
    expect(source).toContain('tag__label')
  })

  it('fills with a brighter frosted layer and darker ink', () => {
    expect(source).toContain('--wipe-surface: rgba(255, 255, 255, 0.45)')
    expect(source).toContain('--wipe-ink: rgba(0, 0, 0, 0.85)')
    expect(source).toContain('backdrop-filter: blur(var(--frosted-layer-blur))')
  })

  it('reveals the wipe from card hover and focus on every card host', () => {
    for (const card of ['.editorial-card', '.mosaic-item', '.product a']) {
      expect(source).toContain(`:global(${card}:hover) .tag`)
      expect(source).toContain(`:global(${card}:focus-visible) .tag`)
    }
    expect(source).toContain('transform: scaleY(1)')
  })
})
