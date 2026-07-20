import {describe, expect, it} from 'vitest'
import {
  validatePortableTextNonEmpty,
  validateRelatedItems,
  validateReferencesUnique,
  validateArticlesMinOneAndUnique,
  validateArticlesNotInAnotherIssue,
  validateIntroMediaExactlyFive,
  validateIssueNumberPositive,
  validateIssueNumberUnique,
  validatePdfAsset,
  validateEditorLetterComplete,
} from './zineContract'

describe('Zine Contract Validators', () => {
  describe('validatePortableTextNonEmpty', () => {
    it('requires portable text with actual content', () => {
      expect(validatePortableTextNonEmpty([])).toContain('required')
      expect(
        validatePortableTextNonEmpty([
          {_type: 'block', children: [{_type: 'span', text: 'Some text'}]},
        ]),
      ).toBe(true)
    })

    it('rejects empty or whitespace-only blocks', () => {
      expect(
        validatePortableTextNonEmpty([
          {_type: 'block', children: [{_type: 'span', text: '   '}]},
        ]),
      ).toContain('required')
    })
  })

  describe('validateRelatedItems', () => {
    it('allows empty related items', () => {
      expect(validateRelatedItems([])).toBe(true)
      expect(validateRelatedItems(undefined)).toBe(true)
    })

    it('requires exactly three items if present', () => {
      expect(validateRelatedItems([{_ref: 'a'}])).toContain('exactly three')
      expect(validateRelatedItems([{_ref: 'a'}, {_ref: 'b'}])).toContain('exactly three')
    })

    it('accepts exactly three unique items', () => {
      expect(
        validateRelatedItems([
          {_ref: 'a'},
          {_ref: 'b'},
          {_ref: 'c'},
        ]),
      ).toBe(true)
    })

    it('rejects duplicate references', () => {
      expect(
        validateRelatedItems([
          {_ref: 'a'},
          {_ref: 'a'},
          {_ref: 'b'},
        ]),
      ).toContain('unique')
    })

    it('prevents self-reference', () => {
      const result = validateRelatedItems([{_ref: 'doc-123'}, {_ref: 'doc-456'}, {_ref: 'doc-789'}], {
        document: {_id: 'doc-123'},
      })
      expect(result).toContain('cannot')
    })

    it('normalizes draft prefix in self-reference check', () => {
      const result = validateRelatedItems(
        [{_ref: 'doc-123'}, {_ref: 'doc-456'}, {_ref: 'doc-789'}],
        {document: {_id: 'drafts.doc-123'}},
      )
      expect(result).toContain('cannot')
    })
  })

  describe('validateReferencesUnique', () => {
    it('returns true for empty or non-array', () => {
      expect(validateReferencesUnique(undefined)).toBe(true)
      expect(validateReferencesUnique([])).toBe(true)
    })

    it('rejects duplicate references', () => {
      const result = validateReferencesUnique([{_ref: 'a'}, {_ref: 'a'}])
      expect(result).toContain('unique')
    })

    it('accepts unique references', () => {
      expect(
        validateReferencesUnique([
          {_ref: 'a'},
          {_ref: 'b'},
          {_ref: 'c'},
        ]),
      ).toBe(true)
    })
  })

  describe('validateArticlesMinOneAndUnique', () => {
    it('rejects non-array', () => {
      const result = validateArticlesMinOneAndUnique(null)
      expect(result).toContain('array')
    })

    it('rejects empty articles array', () => {
      const result = validateArticlesMinOneAndUnique([])
      expect(result).toContain('at least one')
    })

    it('accepts single article', () => {
      expect(validateArticlesMinOneAndUnique([{_ref: 'article-1'}])).toBe(true)
    })

    it('rejects duplicate article references', () => {
      const result = validateArticlesMinOneAndUnique([
        {_ref: 'article-1'},
        {_ref: 'article-1'},
      ])
      expect(result).toContain('unique')
    })

    it('accepts multiple unique articles', () => {
      expect(
        validateArticlesMinOneAndUnique([
          {_ref: 'article-1'},
          {_ref: 'article-2'},
          {_ref: 'article-3'},
        ]),
      ).toBe(true)
    })

    it('warns when an article belongs to another Issue', async () => {
      const result = await validateArticlesNotInAnotherIssue([{_ref: 'article-1'}], {
        document: {_id: 'issue-1'},
        getClient: () => ({fetch: async () => 1}),
      })
      expect(result).toContain('another Issue')
    })
  })

  describe('validateIntroMediaExactlyFive', () => {
    it('rejects non-array', () => {
      const result = validateIntroMediaExactlyFive(null)
      expect(result).toContain('array')
    })

    it('rejects empty media array', () => {
      const result = validateIntroMediaExactlyFive([])
      expect(result).toContain('exactly five')
    })

    it('rejects fewer than five items', () => {
      const result = validateIntroMediaExactlyFive([{}, {}, {}, {}])
      expect(result).toContain('exactly five')
    })

    it('rejects more than five items', () => {
      const result = validateIntroMediaExactlyFive([{}, {}, {}, {}, {}, {}])
      expect(result).toContain('exactly five')
    })

    it('accepts exactly five items', () => {
      expect(validateIntroMediaExactlyFive([{}, {}, {}, {}, {}])).toBe(true)
    })
  })

  describe('validateIssueNumberPositive', () => {
    it('rejects non-number', () => {
      const result = validateIssueNumberPositive('1')
      expect(result).toContain('number')
    })

    it('rejects zero', () => {
      const result = validateIssueNumberPositive(0)
      expect(result).toContain('positive')
    })

    it('rejects negative numbers', () => {
      const result = validateIssueNumberPositive(-1)
      expect(result).toContain('positive')
    })

    it('accepts positive integers', () => {
      expect(validateIssueNumberPositive(1)).toBe(true)
      expect(validateIssueNumberPositive(42)).toBe(true)
      expect(validateIssueNumberPositive(100)).toBe(true)
    })

    it('rejects an issue number already used by another Issue', async () => {
      const result = await validateIssueNumberUnique(5, {
        document: {_id: 'current-issue'},
        getClient: () => ({fetch: async () => 1}),
      })
      expect(result).toContain('unique')
    })

    it('allows the current Issue to retain its number', async () => {
      const result = await validateIssueNumberUnique(5, {
        document: {_id: 'current-issue'},
        getClient: () => ({fetch: async () => 0}),
      })
      expect(result).toBe(true)
    })
  })

  describe('validatePdfAsset', () => {
    it('rejects missing asset', () => {
      const result = validatePdfAsset(null)
      expect(result).toContain('required')
    })

    it('rejects undefined asset', () => {
      const result = validatePdfAsset(undefined)
      expect(result).toContain('required')
    })

    it('rejects non-PDF asset references', () => {
      expect(validatePdfAsset({_ref: 'file-123-jpg'})).toContain('PDF')
    })

    it('accepts PDF file objects', () => {
      expect(validatePdfAsset({_type: 'file', asset: {_ref: 'file-123-pdf'}})).toBe(true)
    })
  })

  describe('validateEditorLetterComplete', () => {
    it('requires an editor letter', () => {
      expect(validateEditorLetterComplete(undefined)).toContain('required')
    })

    it('requires editor letter headline', () => {
      const result = validateEditorLetterComplete({
        body: [{_type: 'block', children: [{text: 'Body'}]}],
        mediaBox: {},
      })
      expect(result).toContain('headline')
    })

    it('requires editor letter body with content', () => {
      const result = validateEditorLetterComplete({
        headline: 'Headline',
        body: [],
        mediaBox: {},
      })
      expect(result).toContain('body')
    })

    it('requires editor letter media', () => {
      const result = validateEditorLetterComplete({
        headline: 'Headline',
        body: [{_type: 'block', children: [{text: 'Body'}]}],
      })
      expect(result).toContain('media')
    })

    it('accepts complete editor letter', () => {
      expect(
        validateEditorLetterComplete({
          headline: 'Editor Letter',
          body: [{_type: 'block', children: [{text: 'Letter content'}]}],
          mediaBox: {asset: [{_type: 'image'}]},
        }),
      ).toBe(true)
    })
  })
})
