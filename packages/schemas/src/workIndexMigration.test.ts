import {describe, expect, it} from 'vitest'
import {migrateLegacyWorkCard, migrateLegacyWorkIndex} from './workIndexMigration'

describe('Work Index migration', () => {
  it('migrates legacy Case Study card settings before removing them', () => {
    expect(
      migrateLegacyWorkCard({
        _id: 'case-study',
        cardSize: 'full',
        cardAspectRatio: '4:5',
      }),
    ).toEqual({
      cardWidth: 'full',
      mediaAspectRatio: '4:5',
      infoPosition: 'below',
    })

    expect(migrateLegacyWorkCard({_id: 'case-study'})).toEqual({
      cardWidth: '1/2',
      mediaAspectRatio: '16:9',
      infoPosition: 'below',
    })
  })

  it('turns legacy ranked Case Studies into fully configured featured cards', () => {
    expect(
      migrateLegacyWorkIndex(
        {},
        [
          {_id: 'first', orderRank: 'a', cardSize: 'full', cardAspectRatio: '4:5'},
          {_id: 'second', orderRank: 'b', cardSize: 'half', cardAspectRatio: '1:1'},
        ],
      ),
    ).toEqual({
      featured: [
        {
          _key: 'migrated-featured-1',
          _type: 'featuredCaseStudy',
          caseStudy: {_type: 'reference', _ref: 'first'},
          cardWidth: 'full',
          mediaAspectRatio: '4:5',
          infoPosition: 'below',
        },
        {
          _key: 'migrated-featured-2',
          _type: 'featuredCaseStudy',
          caseStudy: {_type: 'reference', _ref: 'second'},
          cardWidth: '1/2',
          mediaAspectRatio: '1:1',
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

  it('preserves configured Work Index fields', () => {
    const featured = [{_key: 'existing', _type: 'featuredCaseStudy'}]
    const allSection = {
      listDefaults: {cardWidth: 'full' as const, mediaAspectRatio: '16:9' as const, infoPosition: 'below' as const},
    }

    expect(migrateLegacyWorkIndex({featured, allSection}, [])).toEqual({featured, allSection})
  })

  it('only migrates four unique ranked Case Studies', () => {
    const result = migrateLegacyWorkIndex(
      {},
      [
        {_id: 'a', orderRank: 'a'},
        {_id: 'a', orderRank: 'b'},
        {_id: 'b', orderRank: 'c'},
        {_id: 'c', orderRank: 'd'},
        {_id: 'd', orderRank: 'e'},
        {_id: 'e', orderRank: 'f'},
      ],
    )

    expect(result.featured).toMatchObject([
      {caseStudy: {_ref: 'a'}},
      {caseStudy: {_ref: 'b'}},
      {caseStudy: {_ref: 'c'}},
      {caseStudy: {_ref: 'd'}},
    ])
  })

  it('does not feature Case Studies that have no legacy rank', () => {
    expect(migrateLegacyWorkIndex({}, [{_id: 'unranked'}]).featured).toEqual([])
  })
})
