import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./SortControl.astro', import.meta.url), 'utf8')

describe('SortControl', () => {
  it('renders a header-sized "Sort by" label with the muted label color', () => {
    expect(source).toContain('Sort by')
    expect(source).toContain('type-h5')
    expect(source).toContain('--fg-30')
  })

  it('does not use a native select or open a system dialogue', () => {
    expect(source).not.toContain('<select')
    expect(source).not.toContain('data-sort-select')
    expect(source).not.toContain('form.submit')
  })

  it('toggles between the two publication-date directions via a link to the opposite sort', () => {
    expect(source).toContain("value === 'newest' ? 'oldest' : 'newest'")
    expect(source).toContain('/index?sort=oldest')
    expect(source).toContain('data-sort-toggle')
  })

  it('flips the sort arrow to reflect the current direction', () => {
    expect(source).toContain('data-direction')
    expect(source).toContain('rotate(180deg)')
  })

  it('exposes an accessible label describing the toggle action', () => {
    expect(source).toContain('aria-label')
  })

  it('swaps the sort section in place instead of reloading the full page', () => {
    expect(source).toContain('event.preventDefault()')
    expect(source).toContain('fetch(url)')
    expect(source).toContain('history.pushState')
    expect(source).toContain("addEventListener('popstate'")
  })
})
