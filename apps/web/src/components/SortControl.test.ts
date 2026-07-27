import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./SortControl.astro', import.meta.url), 'utf8')

describe('SortControl', () => {
  it('renders a header-sized label and a native select for sort order', () => {
    expect(source).toContain('Sort by')
    expect(source).toContain('<select')
    expect(source).toContain('name="sort"')
    expect(source).toContain('type="submit"')
  })

  it('exposes the two publication-date sort directions', () => {
    expect(source).toContain("{value: 'newest', label: 'Newest'}")
    expect(source).toContain("{value: 'oldest', label: 'Oldest'}")
    expect(source).toContain('value={option.value}')
    expect(source).toContain('Newest')
    expect(source).toContain('Oldest')
  })

  it('uses the approved large display typography and muted label color', () => {
    expect(source).toContain('type-h5')
    expect(source).toContain('--fg-30')
  })

  it('submits the form on select change for JS users', () => {
    expect(source).toContain('data-sort-control')
    expect(source).toContain('data-sort-select')
    expect(source).toContain('addEventListener')
    expect(source).toContain('form.submit')
  })
})
