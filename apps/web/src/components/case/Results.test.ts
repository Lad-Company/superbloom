import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./Results.astro', import.meta.url), 'utf8')

describe('Case Study Results variants', () => {
  it('branches on the CMS variant, defaulting missing values to quantitative', () => {
    expect(source).toContain("results.variant === 'qualitative'")
  })

  it('stacks qualitative stats as full-bleed bands on the primary surface only', () => {
    expect(source).toContain('class="bands"')
    // No per-band surface alternation — bands inherit the section's primary surface.
    const qualitativeBranch = source.slice(source.indexOf('qualitative ?'), source.indexOf(') : ('))
    expect(qualitativeBranch).toContain('class="band"')
    expect(qualitativeBranch).not.toContain('data-surface-role')
    expect(qualitativeBranch).not.toContain('surfaceVars')
    // The Background Color choice applies only to the quantitative grid.
    expect(source).toContain("!qualitative && results.backgroundColor === 'secondary'")
  })

  it('separates qualitative bands with the contact-footer hairline', () => {
    expect(source).toContain('border-top: 1px solid var(--fg-12)')
  })

  it('renders qualitative statements with display type and a caption, no count-up hook', () => {
    expect(source).toContain('class="band-value type-h4"')
    expect(source).toContain('class="band-label type-caption"')
    // The count-up animation hook exists only in the quantitative branch.
    const qualitativeBranch = source.slice(source.indexOf('qualitative ?'), source.indexOf(') : ('))
    expect(qualitativeBranch).not.toContain('data-results-stats')
    expect(qualitativeBranch).not.toContain('Metric')
  })

  it('keeps the quantitative grid and count-up animation for the default variant', () => {
    expect(source).toContain('data-results-stats')
    expect(source).toContain('revealStats')
    expect(source).toContain('<Metric value={stat.value} label={stat.label} />')
  })

  it('hides the section heading visually in the qualitative band layout', () => {
    expect(source).toContain('<h2 class="sr-only">{label}</h2>')
  })
})
