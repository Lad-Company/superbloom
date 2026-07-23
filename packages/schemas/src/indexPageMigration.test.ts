import {describe, expect, it} from 'vitest'
import {migrateLegacyIndexPage} from './indexPageMigration'

describe('Index Page migration', () => {
  it('turns the legacy lead and secondary composition into fully configured featured cards', () => {
    expect(
      migrateLegacyIndexPage({
        lead: {_ref: 'lead'},
        secondary: [{_ref: 'secondary-1'}, {_ref: 'secondary-2'}, {_ref: 'secondary-3'}],
      }),
    ).toEqual({
      featured: [
        {
          _key: 'migrated-featured-1',
          _type: 'featuredCard',
          article: {_type: 'reference', _ref: 'lead'},
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
          infoPosition: 'below',
        },
        {
          _key: 'migrated-featured-2',
          _type: 'featuredCard',
          article: {_type: 'reference', _ref: 'secondary-1'},
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
          infoPosition: 'below',
        },
        {
          _key: 'migrated-featured-3',
          _type: 'featuredCard',
          article: {_type: 'reference', _ref: 'secondary-2'},
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
          infoPosition: 'below',
        },
        {
          _key: 'migrated-featured-4',
          _type: 'featuredCard',
          article: {_type: 'reference', _ref: 'secondary-3'},
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
          infoPosition: 'below',
        },
      ],
      allSection: {
        listDefaults: {
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
          infoPosition: 'below',
        },
      },
    })
  })

  it('preserves configured Index Page fields', () => {
    const featured = [{_key: 'existing', _type: 'featuredCard'}]
    const allSection = {
      listDefaults: {cardWidth: 'full', mediaAspectRatio: '16:9', infoPosition: 'below'},
    }

    expect(migrateLegacyIndexPage({featured, allSection})).toEqual({featured, allSection})
  })

  it('removes duplicate legacy references before applying the four-card limit', () => {
    expect(
      migrateLegacyIndexPage({
        lead: {_ref: 'article-1'},
        secondary: [{_ref: 'article-1'}, {_ref: 'article-2'}],
      }).featured,
    ).toMatchObject([
      {article: {_ref: 'article-1'}},
      {article: {_ref: 'article-2'}},
    ])
  })
})
