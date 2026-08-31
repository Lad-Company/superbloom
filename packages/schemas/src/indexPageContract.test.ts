import {describe, expect, it} from 'vitest'
import {
  validateIndexPageFeaturedCount,
  validateIndexPageFeaturedCardsUnique,
  validateIndexPageAllListDefaults,
  validateIndexPageItemOverridesUnique,
} from './indexPageContract'
import {indexPage} from './indexPage'

describe('Index Page contract validators', () => {
  describe('validateIndexPageFeaturedCount', () => {
    it('allows an empty section or one lead plus 2-3 side cards', () => {
      expect(validateIndexPageFeaturedCount([])).toBe(true)
      expect(
        validateIndexPageFeaturedCount([
          {article: {_ref: 'a'}},
          {article: {_ref: 'b'}},
          {article: {_ref: 'c'}},
        ]),
      ).toBe(true)
      expect(
        validateIndexPageFeaturedCount([
          {article: {_ref: 'a'}},
          {article: {_ref: 'b'}},
          {article: {_ref: 'c'}},
          {article: {_ref: 'd'}},
        ]),
      ).toBe(true)
    })

    it('rejects 1-2 cards and more than 4 cards', () => {
      expect(validateIndexPageFeaturedCount([{article: {_ref: 'a'}}])).toContain('3-4 cards total')
      expect(
        validateIndexPageFeaturedCount([{article: {_ref: 'a'}}, {article: {_ref: 'b'}}]),
      ).toContain('3-4 cards total')
      expect(
        validateIndexPageFeaturedCount([
          {article: {_ref: 'a'}},
          {article: {_ref: 'b'}},
          {article: {_ref: 'c'}},
          {article: {_ref: 'd'}},
          {article: {_ref: 'e'}},
        ]),
      ).toContain('3-4 cards total')
    })
  })

  describe('validateIndexPageFeaturedCardsUnique', () => {
    it('allows empty or unique featured cards', () => {
      expect(validateIndexPageFeaturedCardsUnique([])).toBe(true)
      expect(
        validateIndexPageFeaturedCardsUnique([{article: {_ref: 'a'}}, {article: {_ref: 'b'}}]),
      ).toBe(true)
    })

    it('rejects duplicate article references', () => {
      expect(
        validateIndexPageFeaturedCardsUnique([{article: {_ref: 'a'}}, {article: {_ref: 'a'}}]),
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

  it('has a required header field', () => {
    const fieldNames = indexPage.fields.map((field) => field.name)
    expect(fieldNames).toContain('header')
    const headerField = indexPage.fields.find((field) => field.name === 'header')
    expect(headerField?.type).toBe('string')
    expect(headerField?.validation).toBeDefined()
  })

  it('locks featured card layout: cards author only their article reference', () => {
    const featured = indexPage.fields.find((field) => field.name === 'featured')
    const cardType = (
      featured as {of?: Array<{name?: string; fields?: Array<{name: string}>}>} | undefined
    )?.of?.find((member) => member.name === 'featuredCard')
    expect(cardType?.fields?.map((field) => field.name)).toEqual(['article'])
  })
})
