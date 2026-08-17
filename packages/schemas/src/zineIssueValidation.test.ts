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
    issueMode: 'full',
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

  it('requires an ISSUU URL', async () => {
    const markers = await errorMarkers(baseZineIssue({issuuUrl: undefined}))
    expect(markers).toEqual([
      {path: ['issuuUrl'], message: expect.stringContaining('Required')},
    ])
  })

  it('requires the issue mode', async () => {
    const markers = await errorMarkers(baseZineIssue({issueMode: undefined}))
    expect(markers).toEqual(
      expect.arrayContaining([{path: ['issueMode'], message: expect.stringContaining('Required')}]),
    )
  })

  it('accepts an embed-only issue with just card media and an ISSUU URL', async () => {
    const markers = await errorMarkers(
      baseZineIssue({
        issueMode: 'embed',
        heroMedia: undefined,
        editorLetter: undefined,
        articles: undefined,
        listDefaults: undefined,
        issuuUrl: 'https://e.issuu.com/embed.html?d=superbloom_zineissue1_web&u=superbloomhouse',
      }),
    )
    expect(markers).toEqual([])
  })

  it('still requires card media, title, and slug for embed-only issues', async () => {
    const markers = await errorMarkers(
      baseZineIssue({issueMode: 'embed', cardMedia: undefined, title: undefined}),
    )
    expect(markers).toEqual(
      expect.arrayContaining([
        {path: ['cardMedia'], message: expect.stringContaining('Required')},
        {path: ['title'], message: expect.stringContaining('Required')},
      ]),
    )
  })

  it('requires an ISSUU URL for embed-only issues too', async () => {
    const markers = await errorMarkers(baseZineIssue({issueMode: 'embed', issuuUrl: undefined}))
    expect(markers).toEqual([
      {path: ['issuuUrl'], message: expect.stringContaining('Required')},
    ])
  })

  it('publishes a formerly-full issue flipped to embed mode with its data intact', async () => {
    // Regression: hidden full-treatment fields keep their data in embed mode
    // and must not block publishing.
    const markers = await errorMarkers(baseZineIssue({issueMode: 'embed'}))
    expect(markers).toEqual([])
  })

  it('publishes an embed-only issue whose hidden fields hold form-initialized empty objects', async () => {
    // Regression: the Studio form initializes hidden object fields as empty
    // objects, and their nested requireds (hero asset, letter image, letter
    // description) must not block publishing — hidden errors are unactionable.
    const markers = await errorMarkers(
      baseZineIssue({
        issueMode: 'embed',
        heroMedia: {_type: 'mediaBox'},
        editorLetter: {
          _type: 'object',
          heading: 'Letter from the Editor',
          ctaLabel: 'Read the Zine',
        },
      }),
    )
    expect(markers).toEqual([])
  })

  it('still requires nested hero and letter fields for full issues', async () => {
    const markers = await errorMarkers(
      baseZineIssue({
        heroMedia: {_type: 'mediaBox'},
        editorLetter: {
          _type: 'object',
          heading: 'Letter from the Editor',
          ctaLabel: 'Read the Zine',
        },
      }),
    )
    expect(markers).toEqual(
      expect.arrayContaining([
        {path: ['heroMedia', 'asset'], message: expect.stringContaining('Required')},
        {path: ['editorLetter', 'media'], message: expect.stringContaining('Required')},
        {path: ['editorLetter', 'body'], message: expect.stringContaining('Required')},
      ]),
    )
  })
})
