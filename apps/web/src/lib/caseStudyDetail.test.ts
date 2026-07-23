import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {caseStudySections} from './caseStudySections'
import {caseStudyBySlugQuery} from './queries'

const navigationSource = readFileSync(
  new URL('../components/case/CaseStudySpineNav.astro', import.meta.url),
  'utf8',
)
const resultsSource = readFileSync(
  new URL('../components/case/Results.astro', import.meta.url),
  'utf8',
)

describe('Case Study detail contract', () => {
  it('keeps the fixed Case Study Spine names and order', () => {
    expect(caseStudySections.map(({field, id, label}) => ({field, id, label}))).toEqual([
      {field: 'highlights', id: 'highlights', label: 'Highlights'},
      {field: 'challenge', id: 'challenge', label: 'Challenge'},
      {
        field: 'unexpectedInsight',
        id: 'unexpected-insight',
        label: 'Unexpected Insight',
      },
      {field: 'bigIdea', id: 'big-idea', label: 'Big Idea'},
      {field: 'results', id: 'results', label: 'Results'},
    ])
  })

  it('projects Results rows, News-only Press, and Next Project', () => {
    expect(caseStudyBySlugQuery).toContain('supportingRows')
    expect(caseStudyBySlugQuery).toContain('stats[]')
    expect(caseStudyBySlugQuery).toContain('@->articleType == "news"')
    expect(caseStudyBySlugQuery).toContain('nextProject->')
    expect(resultsSource).toContain('<ContentLayoutRow')
  })

  it('keeps section navigation keyboard-native and reduced-motion safe', () => {
    expect(navigationSource).toContain('href={`#${section.id}`}')
    expect(navigationSource).toContain('aria-current')
    expect(navigationSource).toContain('focus({ preventScroll: true })')
    expect(navigationSource).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
  })
})
