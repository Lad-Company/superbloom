import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./Results.astro', import.meta.url), 'utf8')

describe('Case Study Results variants', () => {
  it('branches on the CMS variant, defaulting missing values to quantitative', () => {
    expect(source).toContain("results.variant === 'qualitative'")
  })

  it('applies the Background Color choice only to the quantitative grid', () => {
    const qualitativeBranch = source.slice(source.indexOf('qualitative ?'), source.indexOf(') : ('))
    expect(qualitativeBranch).not.toContain('data-surface-role')
    expect(qualitativeBranch).not.toContain('surfaceVars')
    expect(source).toContain("!qualitative && results.backgroundColor === 'secondary'")
  })

  it('renders qualitative statements without the count-up hook', () => {
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
