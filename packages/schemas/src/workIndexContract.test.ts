import {describe, expect, it} from 'vitest'
import {
  validateWorkIndexFeaturedCount,
  validateWorkIndexFeaturedCardsUnique,
  validateWorkIndexAllListDefaults,
  validateWorkIndexItemOverridesUnique,
} from './workIndexContract'

describe('Work Index contract validators', () => {
  describe('validateWorkIndexFeaturedCount', () => {
    it('allows 0-4 featured Case Studies', () => {
      expect(validateWorkIndexFeaturedCount([])).toBe(true)
      expect(validateWorkIndexFeaturedCount([{caseStudy: {_ref: 'a'}}])).toBe(true)
      expect(
        validateWorkIndexFeaturedCount([
          {caseStudy: {_ref: 'a'}},
          {caseStudy: {_ref: 'b'}},
          {caseStudy: {_ref: 'c'}},
          {caseStudy: {_ref: 'd'}},
        ]),
      ).toBe(true)
    })

    it('rejects more than 4 featured Case Studies', () => {
      expect(
        validateWorkIndexFeaturedCount([
          {caseStudy: {_ref: 'a'}},
          {caseStudy: {_ref: 'b'}},
          {caseStudy: {_ref: 'c'}},
          {caseStudy: {_ref: 'd'}},
          {caseStudy: {_ref: 'e'}},
        ]),
      ).toContain('at most 4')
    })
  })

  describe('validateWorkIndexFeaturedCardsUnique', () => {
    it('allows empty or unique featured Case Studies', () => {
      expect(validateWorkIndexFeaturedCardsUnique([])).toBe(true)
      expect(
        validateWorkIndexFeaturedCardsUnique([
          {caseStudy: {_ref: 'a'}},
          {caseStudy: {_ref: 'b'}},
        ]),
      ).toBe(true)
    })

    it('rejects duplicate Case Study references', () => {
      expect(
        validateWorkIndexFeaturedCardsUnique([
          {caseStudy: {_ref: 'a'}},
          {caseStudy: {_ref: 'a'}},
        ]),
      ).toContain('unique')
    })
  })

  describe('validateWorkIndexAllListDefaults', () => {
    it('allows complete or empty list defaults', () => {
      expect(validateWorkIndexAllListDefaults(undefined)).toBe(true)
      expect(
        validateWorkIndexAllListDefaults({
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
          infoPosition: 'below',
        }),
      ).toBe(true)
    })

    it('rejects partial list defaults', () => {
      expect(
        validateWorkIndexAllListDefaults({
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
        }),
      ).toContain('all three')
    })
  })

  it('rejects duplicate item overrides for the same Case Study', () => {
    expect(
      validateWorkIndexItemOverridesUnique([
        {caseStudy: {_ref: 'case-study-1'}},
        {caseStudy: {_ref: 'case-study-1'}},
      ]),
    ).toContain('only one item override')
  })
})
