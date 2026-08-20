import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {indexViewAllNewestQuery, indexViewAllOldestQuery} from '../../lib/queries'

const source = readFileSync(new URL('./index.astro', import.meta.url), 'utf8')

describe('Index page', () => {
  it('renders the large header-sized sort control', () => {
    expect(source).toContain('<SortControl')
    expect(source).toContain('View All')
    expect(source).toContain('type-h3')
  })

  it('renders the type filter and scopes the list query to the selected type', () => {
    expect(source).toContain('<TypeFilter')
    expect(source).toContain('parseArticleTypeFilter')
    expect(source).toContain('typeFilter: type')
  })

  it('filters both view-all queries by the optional type param', () => {
    for (const query of [indexViewAllNewestQuery, indexViewAllOldestQuery]) {
      expect(query).toContain('(!defined($typeFilter) || articleType == $typeFilter)')
    }
  })

  it('excludes Zine Articles from both view-all queries', () => {
    for (const query of [indexViewAllNewestQuery, indexViewAllOldestQuery]) {
      expect(query).toContain('articleType in ["news", "editorial"]')
      expect(query).not.toContain('"zine"')
    }
  })

  it('defaults to the sort control and shows one browse control at a time with JS', () => {
    expect(source).toContain('data-active-control="sort"')
    expect(source).toContain('html.js')
    expect(source).toContain("data-active-control='sort']")
    expect(source).toContain("data-active-control='filter']")
  })

  it('wraps the card list and load-more in a swappable results region', () => {
    expect(source).toContain('data-browse-results')
  })

  it('does not keep the small inline sort links', () => {
    expect(source).not.toContain('class="sort"')
    expect(source).not.toContain('aria-current={sort ===')
  })

  it('renders Index items in minimal title-and-date form', () => {
    expect(source).toContain('minimal')
  })

  it('does not pass a Read More CTA to Index items', () => {
    expect(source).not.toContain('showCopy')
  })

  it('raises the card media cap so CMS-authored ratios survive', () => {
    expect(source).toContain('--card-media-max-height: 120svh')
  })
})
