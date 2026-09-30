import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./Navigation.astro', import.meta.url), 'utf8')

describe('Navigation compact menu in shy state', () => {
  it('drops the shy bar transform while the compact menu is open', () => {
    // The compact panel is position: fixed inside the nav. A non-none
    // transform on the nav (even translateY(0) after the reveal transition
    // settles) makes the nav the panel's containing block, collapsing the
    // full-screen menu to the bar's box — the hamburger in the shy bar then
    // "opens" an invisible menu.
    expect(source).toMatch(/\.navigation\.is-shy:has\(\.compact-menu\[open\]\)\s*\{[^}]*transform:\s*none/)
  })

  it('clears the shy backdrop-filter while the menu is open (same containing-block effect)', () => {
    expect(source).toMatch(/\.navigation\.is-shy:has\(\.compact-menu\[open\]\)\s*\{[^}]*backdrop-filter:\s*none/)
  })

  it('flips the transform instantly — transitioning to none keeps the containing block for the whole transition', () => {
    // The base .navigation transition includes transform (240ms). Changing
    // translateY(0) → none under that transition keeps the computed
    // transform non-none for the full 240ms, so the nav stays the fixed
    // panel's containing block until the transition lands: the menu fills
    // only the bar's box, then hard-cuts to full screen. Measured on the
    // geometry probe: panel 390x88 (bar height) for ~250ms after the tap,
    // then a one-frame snap to 390x844 — the "abrupt" open on the shy bar
    // that the locked-top nav (transform already none) does not have.
    const block =
      source.match(/\.navigation\.is-shy:has\(\.compact-menu\[open\]\)\s*\{([^}]*)\}/)?.[1] ?? ''
    const transitionProperty = block.match(/transition-property:\s*([^;]+)/)?.[1] ?? ''
    expect(transitionProperty).not.toBe('')
    expect(transitionProperty).not.toContain('transform')
  })

  it('outranks .navigation.is-shy.is-revealed so the override actually applies', () => {
    // Specificity must beat the (0,3,0) reveal rule regardless of source
    // order — the .is-shy class in the override selector carries it.
    expect(source).toContain('.navigation.is-shy.is-revealed')
    expect(source).toContain('.navigation.is-shy:has(.compact-menu[open])')
  })
})

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

  it('fades the panel in on open so it does not hard-cut against the bar chrome fades', () => {
    // details renders the panel the frame open flips; without an entrance
    // animation the black full-screen panel cuts in one frame while the
    // bar's color/frost transitions run 240ms around it — an abrupt,
    // glitchy open, most visible when the shy bar is floating mid-page.
    expect(source).toMatch(
      /\.compact-menu\[open\] \.compact-panel\s*\{[^}]*animation:\s*compact-panel-in/,
    )
    // Reduced motion keeps the instant open.
    const reduced = source.match(/prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\n  \}/)?.[1] ?? ''
    expect(reduced).toMatch(/\.compact-menu\[open\] \.compact-panel\s*\{\s*animation:\s*none/)
  })
})
