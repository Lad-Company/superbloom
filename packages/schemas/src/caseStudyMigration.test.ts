import {describe, expect, it} from 'vitest'
import {migrateLegacyCaseStudyBlock} from './caseStudyMigration'

describe('Case Study narrative section migration', () => {
  describe('caseStudyFullBleedMedia', () => {
    it('converts full bleed media into a full-width media row with fullBleed flag', () => {
      const result = migrateLegacyCaseStudyBlock({
        _type: 'caseStudyFullBleedMedia',
        _key: 'hero-media',
        mediaBox: {
          _type: 'mediaBox',
          asset: [{_type: 'image'}],
        },
      })

      expect(result).toEqual({
        _type: 'contentLayoutRow',
        _key: 'hero-media',
        blocks: [
          {
            _type: 'contentLayoutMedia',
            _key: 'hero-media-media',
            width: 'full',
            media: {_type: 'mediaBox', asset: [{_type: 'image'}]},
            aspectRatio: '16:9',
          },
        ],
        fullBleed: true,
      })
    })

    it('throws when full bleed media has no mediaBox', () => {
      expect(() =>
        migrateLegacyCaseStudyBlock({
          _type: 'caseStudyFullBleedMedia',
          _key: 'empty-hero',
        }),
      ).toThrow('has no media')
    })
  })

  describe('caseStudyTextMedia', () => {
    it('converts text+media with media on left into a row with media first', () => {
      const result = migrateLegacyCaseStudyBlock({
        _type: 'caseStudyTextMedia',
        _key: 'text-media-left',
        text: [{_type: 'block', children: [{text: 'Some content'}]}],
        mediaBox: {_type: 'mediaBox', asset: [{_type: 'image'}]},
        mediaPosition: 'left',
        mediaWidth: 'half',
      })

      expect(result).toMatchObject({
        _type: 'contentLayoutRow',
        _key: 'text-media-left',
        blocks: [
          {
            _type: 'contentLayoutMedia',
            width: '1/2',
            aspectRatio: '16:9',
          },
          {
            _type: 'contentLayoutText',
            width: '1/2',
            text: [{_type: 'block', children: [{text: 'Some content'}]}],
          },
        ],
      })
    })

    it('converts text+media with media on right into a row with text first', () => {
      const result = migrateLegacyCaseStudyBlock({
        _type: 'caseStudyTextMedia',
        _key: 'text-media-right',
        text: [{_type: 'block', children: [{text: 'Content'}]}],
        mediaBox: {_type: 'mediaBox', asset: [{_type: 'image'}]},
        mediaPosition: 'right',
        mediaWidth: 'three-quarters',
      })

      expect(result).toMatchObject({
        _type: 'contentLayoutRow',
        _key: 'text-media-right',
        blocks: [
          {
            _type: 'contentLayoutText',
            width: '1/4',
            text: [{_type: 'block', children: [{text: 'Content'}]}],
          },
          {
            _type: 'contentLayoutMedia',
            width: '3/4',
            aspectRatio: '16:9',
          },
        ],
      })
    })

    it('maps mediaWidth half to 1/2 and three-quarters to 3/4', () => {
      const halfResult = migrateLegacyCaseStudyBlock({
        _type: 'caseStudyTextMedia',
        _key: 'half',
        text: [{_type: 'block'}],
        mediaBox: {_type: 'mediaBox', asset: []},
        mediaPosition: 'left',
        mediaWidth: 'half',
      })
      expect(halfResult.blocks[0].width).toBe('1/2')
      expect(halfResult.blocks[1].width).toBe('1/2')

      const threeQuartersResult = migrateLegacyCaseStudyBlock({
        _type: 'caseStudyTextMedia',
        _key: 'three-quarters',
        text: [{_type: 'block'}],
        mediaBox: {_type: 'mediaBox', asset: []},
        mediaPosition: 'right',
        mediaWidth: 'three-quarters',
      })
      expect(threeQuartersResult.blocks[0].width).toBe('1/4')
      expect(threeQuartersResult.blocks[1].width).toBe('3/4')
    })

    it('preserves the legacy default when mediaWidth is absent', () => {
      const result = migrateLegacyCaseStudyBlock({
        _type: 'caseStudyTextMedia',
        _key: 'default-width',
        text: [{_type: 'block'}],
        mediaBox: {_type: 'mediaBox', asset: []},
        mediaPosition: 'right',
      })

      expect(result.blocks.map((block) => block.width)).toEqual(['1/4', '3/4'])
    })

    it('throws when text+media block has incomplete fields', () => {
      expect(() =>
        migrateLegacyCaseStudyBlock({
          _type: 'caseStudyTextMedia',
          _key: 'incomplete',
          // missing text
          mediaBox: {_type: 'mediaBox', asset: []},
          mediaPosition: 'left',
        }),
      ).toThrow('incomplete fields')

      expect(() =>
        migrateLegacyCaseStudyBlock({
          _type: 'caseStudyTextMedia',
          _key: 'no-media',
          text: [{_type: 'block'}],
          // missing mediaBox
          mediaPosition: 'left',
        }),
      ).toThrow('incomplete fields')
    })
  })

  describe('caseStudyPairedPortraitMedia', () => {
    it('converts paired portrait media into a two-block 1/2 + 1/2 media row', () => {
      const result = migrateLegacyCaseStudyBlock({
        _type: 'caseStudyPairedPortraitMedia',
        _key: 'paired-portraits',
        mediaBoxes: [
          {_type: 'mediaBox', asset: [{_type: 'image'}]},
          {_type: 'mediaBox', asset: [{_type: 'image'}]},
        ],
      })

      expect(result).toEqual({
        _type: 'contentLayoutRow',
        _key: 'paired-portraits',
        blocks: [
          {
            _type: 'contentLayoutMedia',
            _key: 'paired-portraits-media-1',
            width: '1/2',
            media: {_type: 'mediaBox', asset: [{_type: 'image'}]},
            aspectRatio: '4:5',
          },
          {
            _type: 'contentLayoutMedia',
            _key: 'paired-portraits-media-2',
            width: '1/2',
            media: {_type: 'mediaBox', asset: [{_type: 'image'}]},
            aspectRatio: '4:5',
          },
        ],
      })
    })

    it('throws when paired portrait does not have exactly 2 media items', () => {
      expect(() =>
        migrateLegacyCaseStudyBlock({
          _type: 'caseStudyPairedPortraitMedia',
          _key: 'incomplete-pair',
          mediaBoxes: [{_type: 'mediaBox', asset: []}],
        }),
      ).toThrow('exactly 2 media items')

      expect(() =>
        migrateLegacyCaseStudyBlock({
          _type: 'caseStudyPairedPortraitMedia',
          _key: 'triple',
          mediaBoxes: [
            {_type: 'mediaBox', asset: []},
            {_type: 'mediaBox', asset: []},
            {_type: 'mediaBox', asset: []},
          ],
        }),
      ).toThrow('exactly 2 media items')
    })
  })

  describe('edge cases', () => {
    it('preserves _key in converted rows for stable referencing', () => {
      const result = migrateLegacyCaseStudyBlock({
        _type: 'caseStudyFullBleedMedia',
        _key: 'stable-key-123',
        mediaBox: {_type: 'mediaBox', asset: []},
      })
      expect(result._key).toBe('stable-key-123')
    })

    it('generates deterministic child keys from parent _key', () => {
      const result = migrateLegacyCaseStudyBlock({
        _type: 'caseStudyPairedPortraitMedia',
        _key: 'parent',
        mediaBoxes: [{_type: 'mediaBox', asset: []}, {_type: 'mediaBox', asset: []}],
      })
      expect(result.blocks[0]._key).toBe('parent-media-1')
      expect(result.blocks[1]._key).toBe('parent-media-2')
    })
  })
})
