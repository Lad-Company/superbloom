import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {ARTICLE_TYPES, ARTICLE_TYPE_LABELS, parseArticleTypeFilter} from '../lib/articleTypes'

const source = readFileSync(new URL('./TypeFilter.astro', import.meta.url), 'utf8')

describe('TypeFilter', () => {
  it('renders a header-sized "Filter by" label with the muted label color', () => {
    expect(source).toContain('Filter by')
    expect(source).toContain('type-h5')
    expect(source).toContain('--fg-30')
  })

  it('offers every visitor-facing article type as a dropdown option', () => {
    expect(ARTICLE_TYPES).toEqual(['news', 'editorial', 'zine'])
    expect(ARTICLE_TYPE_LABELS).toEqual({news: 'News', editorial: 'Editorial', zine: 'Zine'})
    expect(source).toContain('ARTICLE_TYPES.map')
    expect(source).toContain('data-type-filter')
  })

  it('uses a details dropdown, not a native select or system dialogue', () => {
    expect(source).toContain('<details')
    expect(source).toContain('<summary')
    expect(source).not.toContain('<select')
  })

  it('marks the selected type and clears the filter by re-selecting it', () => {
    expect(source).toContain("aria-current={selected")
    expect(source).toContain('hrefFor(selected ? null : type)')
  })

  it('has no explicit clear control beyond unselecting the active type', () => {
    expect(source).not.toContain('Clear all')
    expect(source).not.toContain('Reset')
  })

  it('preserves the active sort order in the option hrefs', () => {
    expect(source).toContain("params.set('sort', 'oldest')")
  })

  it('shares the browse section in-place swap instead of reloading the page', () => {
    expect(source).toContain('initBrowseSwap')
  })

  it('renders the "Filter by" label as a button that swaps to the sort control', () => {
    expect(source).toContain('<button type="button"')
    expect(source).toContain('data-mode-swap')
  })

  it('parses only visitor-facing article types from the URL', () => {
    expect(parseArticleTypeFilter('news')).toBe('news')
    expect(parseArticleTypeFilter('editorial')).toBe('editorial')
    expect(parseArticleTypeFilter('zine')).toBe('zine')
    expect(parseArticleTypeFilter('case-study')).toBeNull()
    expect(parseArticleTypeFilter('')).toBeNull()
    expect(parseArticleTypeFilter(null)).toBeNull()
  })
})
