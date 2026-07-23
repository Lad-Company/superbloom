import {describe, expect, it} from 'vitest'
import {migrateLegacyArticleBlock} from './articleMigration'

describe('Article body migration', () => {
  it('converts text sections into full-width Text rows', () => {
    expect(
      migrateLegacyArticleBlock({
        _type: 'articleTextSection',
        _key: 'intro',
        heading: 'Introduction',
        text: [{_type: 'block'}],
      }),
    ).toEqual({
      _type: 'contentLayoutRow',
      _key: 'intro',
      blocks: [
        {
          _type: 'contentLayoutText',
          _key: 'intro-text',
          width: 'full',
          heading: 'Introduction',
          text: [{_type: 'block'}],
        },
      ],
    })
  })

  it('converts paired media into a valid two-block row', () => {
    expect(
      migrateLegacyArticleBlock({
        _type: 'articleMediaSection',
        _key: 'pair',
        layout: 'paired',
        pairedMedia: [{_type: 'mediaBox', asset: []}, {_type: 'mediaBox', asset: []}],
      }),
    ).toMatchObject({
      _type: 'contentLayoutRow',
      _key: 'pair',
      blocks: [
        {width: '1/2', aspectRatio: '16:9'},
        {width: '1/2', aspectRatio: '16:9'},
      ],
    })
  })

  it('refuses to migrate incomplete media sections', () => {
    expect(() =>
      migrateLegacyArticleBlock({
        _type: 'articleMediaSection',
        _key: 'empty',
        layout: 'full-width',
      }),
    ).toThrow('incomplete media')
  })
})
