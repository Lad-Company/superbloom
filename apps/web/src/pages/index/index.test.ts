import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./index.astro', import.meta.url), 'utf8')

describe('Index page', () => {
  it('renders the large header-sized sort control', () => {
    expect(source).toContain('<SortControl')
    expect(source).toContain('View All')
    expect(source).toContain('type-h3')
  })

  it('does not keep the small inline sort links', () => {
    expect(source).not.toContain('class="sort"')
    expect(source).not.toContain('aria-current={sort ===')
  })

  it('renders Index items in minimal title-and-date form', () => {
    expect(source).toContain('minimal')
    expect(source).toContain('dateFormat="index"')
  })

  it('does not pass a Read More CTA to Index items', () => {
    expect(source).not.toContain('showCopy')
  })
})
