/**
 * Document-level validation wiring for zine issues, through the real Studio
 * validation engine. Asserts marker paths so cross-field errors deep-link
 * to their fields in the Studio validation panel.
 */
import {describe, expect, it} from 'vitest'
import {errorMarkers, mediaBoxImage, textBlock} from './validationHarness'

function baseZineIssue(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'drafts.issue-1',
    _type: 'zineIssue',
    title: 'Issue One',
    slug: {_type: 'slug', current: 'issue-one'},
    cardMedia: mediaBoxImage(),
    heroMedia: mediaBoxImage(),
    editorLetter: {
      media: mediaBoxImage(),
      heading: 'Letter from the Editor',
      body: [textBlock('Dear reader')],
      ctaLabel: 'Read the Zine',
    },
    articles: [{_type: 'reference', _ref: 'article-1', _key: 'a1'}],
    listDefaults: {cardWidth: '1/2', mediaAspectRatio: '16:9', infoPosition: 'below'},
    issuuUrl: 'https://issuu.com/superbloom/docs/issue-one',
    ...overrides,
  } as any
}

describe('zine issue document validation', () => {
  it('accepts a valid issue with an ISSUU URL', async () => {
    expect(await errorMarkers(baseZineIssue())).toEqual([])
  })

  it('points the ISSUU-or-PDF requirement at both source fields', async () => {
    const markers = await errorMarkers(baseZineIssue({issuuUrl: undefined}))
    expect(markers).toHaveLength(2)
    expect(markers).toEqual(
      expect.arrayContaining([
        {path: ['issuuUrl'], message: expect.stringContaining('ISSUU')},
        {path: ['pdfAsset'], message: expect.stringContaining('ISSUU')},
      ]),
    )
  })

  it('points the ISSUU-and-PDF conflict at both source fields', async () => {
    const markers = await errorMarkers(
      baseZineIssue({pdfAsset: {_type: 'file', asset: {_type: 'reference', _ref: 'file-abc'}}}),
    )
    expect(markers).toHaveLength(2)
    expect(markers).toEqual(
      expect.arrayContaining([
        {path: ['issuuUrl'], message: expect.stringContaining('not both')},
        {path: ['pdfAsset'], message: expect.stringContaining('not both')},
      ]),
    )
  })
})
