import {describe, expect, it} from 'vitest'
import {
  validatePortableTextNonEmpty,
  validateRelatedItems,
  validateReferencesUnique,
  validateArticlesMinThreeAndUnique,
  validateArticlesNotInAnotherIssue,
  validateIssuuUrl,
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

  describe('validateArticlesMinThreeAndUnique', () => {
    it('rejects non-array', () => {
      const result = validateArticlesMinThreeAndUnique(null)
      expect(result).toContain('array')
    })

    it('requires at least three articles', () => {
      expect(validateArticlesMinThreeAndUnique([])).toContain('at least three')
      expect(validateArticlesMinThreeAndUnique([{_ref: 'article-1'}])).toContain('at least three')
      expect(
        validateArticlesMinThreeAndUnique([{_ref: 'article-1'}, {_ref: 'article-2'}]),
      ).toContain('at least three')
    })

    it('rejects duplicate article references', () => {
      const result = validateArticlesMinThreeAndUnique([
        {_ref: 'article-1'},
        {_ref: 'article-1'},
        {_ref: 'article-2'},
      ])
      expect(result).toContain('unique')
    })

    it('accepts three unique articles', () => {
      expect(
        validateArticlesMinThreeAndUnique([
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

  describe('validateIssuuUrl', () => {
    it('requires an ISSUU URL', () => {
      expect(validateIssuuUrl(undefined)).toContain('required')
      expect(validateIssuuUrl('https://example.com/issue')).toContain('ISSUU')
    })

    it('accepts publication and embed URLs', () => {
      expect(validateIssuuUrl('https://issuu.com/superbloom/docs/issue-one')).toBe(true)
      expect(validateIssuuUrl('https://e.issuu.com/embed.html?d=issue-one')).toBe(true)
    })
  })
})
