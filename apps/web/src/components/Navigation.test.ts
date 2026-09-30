import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./Navigation.astro', import.meta.url), 'utf8')

const compactBlock = (selector: string) =>
  source.match(new RegExp(`\\.compact-actions \\.${selector} \\{([^}]*)\\}`))?.[1] ?? ''

describe('Navigation compact panel', () => {
  it('pins the panel buttons to fixed colors so nav theme vars cannot recolor the open menu', () => {
    // The open compact menu is a constant black surface. The shy nav
    // rewrites --bg/--fg as it samples sections on desktop, so buttons that
    // consume those vars change color with scroll position — including
    // while the menu is open. Both panel buttons must be fully fixed.
    for (const block of [compactBlock('btn-secondary'), compactBlock('btn-tertiary')]) {
      expect(block).not.toBe('')
      expect(block).not.toContain('var(--bg')
      expect(block).not.toContain('var(--fg')
      expect(block).toContain('--wipe-surface')
      expect(block).toContain('--wipe-ink')
    }
  })

  it('keeps logo and toggle white over the black panel regardless of nav theme', () => {
    expect(source).toContain('.navigation:has(.compact-menu[open])')
  })
})
