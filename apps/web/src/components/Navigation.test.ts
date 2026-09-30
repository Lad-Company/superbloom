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

  it('outranks .navigation.is-shy.is-revealed so the override actually applies', () => {
    // Specificity must beat the (0,3,0) reveal rule regardless of source
    // order — the .is-shy class in the override selector carries it.
    expect(source).toContain('.navigation.is-shy.is-revealed')
    expect(source).toContain('.navigation.is-shy:has(.compact-menu[open])')
  })
})
