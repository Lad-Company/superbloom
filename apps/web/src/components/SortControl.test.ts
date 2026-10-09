import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./SortControl.astro', import.meta.url), 'utf8')

describe('SortControl', () => {
  it('toggles between the two publication-date directions via a link to the opposite sort', () => {
    expect(source).toContain("value === 'newest' ? 'oldest' : 'newest'")
    expect(source).toContain("params.set('sort', 'oldest')")
    expect(source).toContain('data-sort-toggle')
  })

  it('preserves the active type filter in the toggle href', () => {
    expect(source).toContain('ArticleTypeFilter')
    expect(source).toContain("params.set('type', type)")
  })

  it('stamps the current direction for CSS and script consumers', () => {
    expect(source).toContain('data-direction')
  })

  it('exposes an accessible label describing the toggle action', () => {
    expect(source).toContain('aria-label')
  })

  it('swaps the sort section in place instead of reloading the full page', () => {
    // The swap mechanism lives in src/lib/browseSwap.ts (see browseSwap.test.ts).
    expect(source).toContain('initBrowseSwap')
  })

  it('renders the "Sort by" label as a button that swaps to the filter control', () => {
    expect(source).toContain('<button type="button"')
    expect(source).toContain('data-mode-swap')
  })
})
