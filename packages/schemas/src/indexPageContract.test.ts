import {describe, expect, it} from 'vitest'
import {
  validateIndexPageFeaturedCount,
  validateIndexPageFeaturedCardsUnique,
  validateIndexPageAllListDefaults,
  validateIndexPageItemOverridesUnique,
} from './indexPageContract'

describe('Index Page contract validators', () => {
  describe('validateIndexPageFeaturedCount', () => {
    it('allows 0-4 featured cards', () => {
      expect(validateIndexPageFeaturedCount([])).toBe(true)
      expect(validateIndexPageFeaturedCount([{article: {_ref: 'a'}}])).toBe(true)
      expect(
        validateIndexPageFeaturedCount([
          {article: {_ref: 'a'}},
          {article: {_ref: 'b'}},
          {article: {_ref: 'c'}},
          {article: {_ref: 'd'}},
        ]),
      ).toBe(true)
    })

    it('rejects more than 4 featured cards', () => {
      expect(
        validateIndexPageFeaturedCount([
          {article: {_ref: 'a'}},
          {article: {_ref: 'b'}},
          {article: {_ref: 'c'}},
          {article: {_ref: 'd'}},
          {article: {_ref: 'e'}},
        ]),
      ).toContain('at most 4')
    })
  })

  describe('validateIndexPageFeaturedCardsUnique', () => {
    it('allows empty or unique featured cards', () => {
      expect(validateIndexPageFeaturedCardsUnique([])).toBe(true)
      expect(
        validateIndexPageFeaturedCardsUnique([
          {article: {_ref: 'a'}},
          {article: {_ref: 'b'}},
        ]),
      ).toBe(true)
    })

    it('rejects duplicate article references', () => {
      expect(
        validateIndexPageFeaturedCardsUnique([
          {article: {_ref: 'a'}},
          {article: {_ref: 'a'}},
        ]),
      ).toContain('unique')
    })
  })

  describe('validateIndexPageAllListDefaults', () => {
    it('allows complete or empty list defaults', () => {
      expect(validateIndexPageAllListDefaults(undefined)).toBe(true)
      expect(
        validateIndexPageAllListDefaults({
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
          infoPosition: 'below',
        }),
      ).toBe(true)
    })

    it('rejects partial list defaults', () => {
      expect(
        validateIndexPageAllListDefaults({
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
        }),
      ).toContain('all three')
    })
  })

  it('rejects duplicate item overrides for the same Article', () => {
    expect(
      validateIndexPageItemOverridesUnique([
        {article: {_ref: 'article-1'}},
        {article: {_ref: 'article-1'}},
      ]),
    ).toContain('only one item override')
  })
})
