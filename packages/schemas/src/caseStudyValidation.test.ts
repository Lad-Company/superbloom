/**
 * Document-level validation wiring for case studies, exercised through the
 * real Studio validation engine (validateDocument) against the real compiled
 * schema. Marker paths are what the Studio validation panel uses to deep-link
 * an error to its field, so these tests assert paths — not just messages.
 *
 * Regression: cross-field rules used to return bare strings from the
 * document-level rule, which Studio attaches to the document root
 * (path: []) — the publish banner gave editors no direction to the field.
 */
import {describe, expect, it} from 'vitest'
import {errorMarkers, mediaBoxImage, textBlock} from './validationHarness'

const narrativeSection = () => ({
  _type: 'caseStudyNarrativeSection',
  summary: [textBlock('Summary text')],
})

function baseCaseStudy(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'drafts.case-study-1',
    _type: 'caseStudy',
    title: 'Test Study',
    slug: {_type: 'slug', current: 'test-study'},
    client: 'Test Client',
    capabilities: [{_type: 'reference', _ref: 'capability-1', _key: 'cap1'}],
    publicationDate: '2026-01-01T00:00:00.000Z',
    cardMedia: mediaBoxImage(),
    cardWidth: '1/2',
    mediaAspectRatio: '16:9',
    infoPosition: 'below',
    primaryColor: {_type: 'color', hex: '#fdd143'},
    highlights: narrativeSection(),
    challenge: narrativeSection(),
    unexpectedInsight: narrativeSection(),
    bigIdea: narrativeSection(),
    results: {
      _type: 'caseStudyResults',
      variant: 'quantitative',
      backgroundColor: 'primary',
      stats: [{_type: 'caseStudyStat', _key: 's1', value: '42%', label: 'Conversion'}],
    },
    ...overrides,
  } as any
}

const qualitativeResults = {
  _type: 'caseStudyResults',
  variant: 'qualitative',
  backgroundColor: 'primary',
  stats: [{_type: 'caseStudyStat', _key: 's1', value: 'A big statement', label: 'Caption'}],
}

describe('case study document validation', () => {
  it('accepts quantitative results without a secondary color (pre-existing documents)', async () => {
    expect(await errorMarkers(baseCaseStudy())).toEqual([])
  })

  it('accepts qualitative results when a secondary color is set', async () => {
    const markers = await errorMarkers(
      baseCaseStudy({
        secondaryColor: {_type: 'color', hex: '#3f2293'},
        results: qualitativeResults,
      }),
    )
    expect(markers).toEqual([])
  })

  it('accepts qualitative results without a secondary color', async () => {
    const markers = await errorMarkers(baseCaseStudy({results: qualitativeResults}))
    expect(markers).toEqual([])
  })

  it('accepts qualitative results with a stale secondary background and no secondary color', async () => {
    const markers = await errorMarkers(
      baseCaseStudy({results: {...qualitativeResults, backgroundColor: 'secondary'}}),
    )
    expect(markers).toEqual([])
  })

  it('points the secondary-background error at the secondaryColor field', async () => {
    const markers = await errorMarkers(
      baseCaseStudy({
        results: {...qualitativeResults, variant: 'quantitative', backgroundColor: 'secondary'},
      }),
    )
    expect(markers).toEqual([
      {
        path: ['secondaryColor'],
        message: expect.stringContaining('Secondary Brand Color'),
      },
    ])
  })

  it('points the info-position/card-width error at both card settings fields', async () => {
    const markers = await errorMarkers(
      baseCaseStudy({cardWidth: '1/4', infoPosition: 'left'}),
    )
    expect(markers).toHaveLength(2)
    expect(markers).toEqual(
      expect.arrayContaining([
        {path: ['infoPosition'], message: expect.stringContaining('Info position')},
        {path: ['cardWidth'], message: expect.stringContaining('Info position')},
      ]),
    )
  })
})
