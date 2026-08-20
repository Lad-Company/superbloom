/**
 * Document-level validation wiring for articles, through the real Studio
 * validation engine. Asserts marker paths so cross-field errors deep-link
 * to their fields in the Studio validation panel.
 */
import {describe, expect, it} from 'vitest'
import {errorMarkers, mediaBoxImage, textBlock} from './validationHarness'

function baseArticle(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'drafts.article-1',
    _type: 'article',
    title: 'Test Article',
    slug: {_type: 'slug', current: 'test-article'},
    articleType: 'editorial',
    cardMedia: mediaBoxImage(),
    cardWidth: '1/2',
    mediaAspectRatio: '16:9',
    infoPosition: 'below',
    leadMedia: mediaBoxImage(),
    overview: [textBlock('Overview text')],
    body: [
      {
        _type: 'contentLayoutRow',
        _key: 'row1',
        blocks: [
          {
            _type: 'contentLayoutText',
            _key: 'tb1',
            width: 'full',
            text: [textBlock('Body text')],
          },
        ],
      },
    ],
    ...overrides,
  } as any
}

describe('article document validation', () => {
  it('accepts a valid editorial article', async () => {
    expect(await errorMarkers(baseArticle())).toEqual([])
  })

  it('accepts a news article without lead media', async () => {
    const markers = await errorMarkers(
      baseArticle({
        articleType: 'news',
        destination: 'https://example.com/story',
        leadMedia: undefined,
      }),
    )
    expect(markers).toEqual([])
  })

  it('requires lead media for editorial articles', async () => {
    const markers = await errorMarkers(baseArticle({leadMedia: undefined}))
    expect(markers).toEqual(
      expect.arrayContaining([{path: ['leadMedia'], message: 'Lead media is required.'}]),
    )
  })

  it('points the info-position/card-width error at both card settings fields', async () => {
    const markers = await errorMarkers(baseArticle({cardWidth: '1/4', infoPosition: 'left'}))
    expect(markers).toHaveLength(2)
    expect(markers).toEqual(
      expect.arrayContaining([
        {path: ['infoPosition'], message: expect.stringContaining('Info position')},
        {path: ['cardWidth'], message: expect.stringContaining('Info position')},
      ]),
    )
  })
})
