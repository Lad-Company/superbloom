import {describe, expect, it} from 'vitest'
import {
  validatePortableTextNonEmpty,
  validateRelatedItems,
  validateReferencesUnique,
  validateArticlesMinOneAndUnique,
  validateArticlesNotInAnotherIssue,
  validateZineArticleIssueMembership,
  validateIssuuUrl,
  isEmbedOnlyHiddenField,
  isEmbedOnlyIssue,
  validateFullIssueField,
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

    it('requires at least one article', () => {
      expect(validateArticlesMinOneAndUnique([])).toContain('at least one')
      expect(validateArticlesMinOneAndUnique([{_ref: 'article-1'}])).toBe(true)
    })

    it('rejects duplicate article references', () => {
      const result = validateArticlesMinOneAndUnique([
        {_ref: 'article-1'},
        {_ref: 'article-1'},
        {_ref: 'article-2'},
      ])
      expect(result).toContain('unique')
    })

    it('accepts one or more unique articles', () => {
      expect(validateArticlesMinOneAndUnique([{_ref: 'article-1'}])).toBe(true)
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

  describe('validateZineArticleIssueMembership', () => {
    const document = {_id: 'drafts.article-1', articleType: 'zine'}

    it('allows Zine Articles with exactly one Issue', async () => {
      await expect(
        validateZineArticleIssueMembership(document, {
          getClient: () => ({fetch: async () => [{_id: 'issue-1', title: 'Issue One'}]}),
        }),
      ).resolves.toBe(true)
    })

    it('blocks Zine Articles with no published Issue', async () => {
      await expect(
        validateZineArticleIssueMembership(document, {
          getClient: () => ({fetch: async () => []}),
        }),
      ).resolves.toContain('exactly one')
    })

    it('blocks Zine Articles in multiple published Issues', async () => {
      await expect(
        validateZineArticleIssueMembership(document, {
          getClient: () => ({
            fetch: async () => [
              {_id: 'issue-1', title: 'Issue One'},
              {_id: 'issue-2', title: 'Issue Two'},
            ],
          }),
        }),
      ).resolves.toContain('Issue One, Issue Two')
    })

    it('treats draft and published copies as one Issue', async () => {
      await expect(
        validateZineArticleIssueMembership(document, {
          getClient: () => ({
            fetch: async () => [
              {_id: 'issue-1', title: 'Issue One'},
              {_id: 'drafts.issue-1', title: 'Issue One'},
            ],
          }),
        }),
      ).resolves.toBe(true)
    })

    it('ignores non-Zine Articles', async () => {
      await expect(
        validateZineArticleIssueMembership(
          {_id: 'article-1', articleType: 'editorial'},
          {getClient: () => ({fetch: async () => 0})},
        ),
      ).resolves.toBe(true)
    })
  })

  describe('isEmbedOnlyIssue', () => {
    it('detects the embed-only mode', () => {
      expect(isEmbedOnlyIssue({issueMode: 'embed'})).toBe(true)
      expect(isEmbedOnlyIssue({issueMode: 'full'})).toBe(false)
      expect(isEmbedOnlyIssue({})).toBe(false)
      expect(isEmbedOnlyIssue(undefined)).toBe(false)
    })
  })

  describe('isEmbedOnlyHiddenField', () => {
    const embedDoc = {_id: 'i1', issueMode: 'embed'}

    it('is true inside hidden full-treatment fields of embed-only issues', () => {
      expect(isEmbedOnlyHiddenField({document: embedDoc, path: ['heroMedia', 'asset']})).toBe(true)
      expect(isEmbedOnlyHiddenField({document: embedDoc, path: ['editorLetter', 'body']})).toBe(true)
      expect(isEmbedOnlyHiddenField({document: embedDoc, path: ['listDefaults', 'cardWidth']})).toBe(
        true,
      )
    })

    it('is false for visible fields on embed-only issues', () => {
      expect(isEmbedOnlyHiddenField({document: embedDoc, path: ['cardMedia', 'asset']})).toBe(false)
      expect(isEmbedOnlyHiddenField({document: embedDoc, path: ['issuuUrl']})).toBe(false)
    })

    it('is false for full issues and non-issue documents', () => {
      expect(
        isEmbedOnlyHiddenField({document: {_id: 'i1', issueMode: 'full'}, path: ['heroMedia']}),
      ).toBe(false)
      expect(isEmbedOnlyHiddenField({document: {_type: 'caseStudy'}, path: ['heroMedia']})).toBe(
        false,
      )
      expect(isEmbedOnlyHiddenField(undefined)).toBe(false)
    })
  })

  describe('validateFullIssueField', () => {
    it('waives the requirement for embed-only issues', () => {
      expect(
        validateFullIssueField(undefined, {document: {_id: 'i1', issueMode: 'embed'}}),
      ).toBe(true)
    })

    it('requires a value for full issues', () => {
      expect(validateFullIssueField(undefined, {document: {_id: 'i1', issueMode: 'full'}})).toContain(
        'full issues',
      )
      expect(validateFullIssueField(undefined, {document: {_id: 'i1'}})).toContain('full issues')
      expect(validateFullIssueField({asset: []}, {document: {_id: 'i1'}})).toBe(true)
    })
  })
})
