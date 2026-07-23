import {describe, expect, it, vi} from 'vitest'
import {
  validateArticleBody,
  validateNewsContent,
  validateRelatedItems,
  validateExternalCoverage,
  validateScopedSlugUniqueness,
} from './articleContract'

describe('Article contract validators', () => {
  it('requires editorial bodies to contain content', () => {
    expect(validateArticleBody([], {document: {articleType: 'editorial'}})).toContain('required')
    expect(
      validateArticleBody(
        [{_type: 'contentLayoutRow', blocks: [{_type: 'contentLayoutText', width: 'full'}]}],
        {document: {articleType: 'editorial'}},
      ),
    ).toBe(true)
  })

  it('allows News without a body only when it has coverage', () => {
    expect(
      validateArticleBody([], {document: {articleType: 'news', externalCoverage: [{outlet: 'Press'}]}}),
    ).toBe(true)
    expect(validateArticleBody([], {document: {articleType: 'news'}})).toContain('body or external coverage')
  })

  it('allows Zine bodies to be required', () => {
    expect(validateArticleBody([], {document: {articleType: 'zine'}})).toContain('required')
    expect(
      validateArticleBody(
        [{_type: 'contentLayoutRow', blocks: [{_type: 'contentLayoutText', width: 'full'}]}],
        {document: {articleType: 'zine'}},
      ),
    ).toBe(true)
  })

  it('rejects News documents with neither body nor coverage', () => {
    expect(validateNewsContent({})).toContain('body or external coverage')
    expect(validateNewsContent({externalCoverage: [{outlet: 'Press'}]})).toBe(true)
  })

  it('requires related items to be empty or exactly three unique items', () => {
    expect(validateRelatedItems([])).toBe(true)
    expect(validateRelatedItems([{_ref: 'a'}])).toContain('exactly three')
    expect(validateRelatedItems([{_ref: 'a'}, {_ref: 'b'}, {_ref: 'c'}])).toBe(true)
    expect(validateRelatedItems([{_ref: 'a'}, {_ref: 'a'}, {_ref: 'b'}])).toContain('unique')
  })

  it('prevents self-referential related items', () => {
    expect(
      validateRelatedItems([{_ref: 'article-1'}, {_ref: 'article-2'}, {_ref: 'article-3'}], {
        document: {_id: 'article-1'},
      }),
    ).toContain('cannot be related to itself')

    expect(
      validateRelatedItems([{_ref: 'drafts.article-1'}, {_ref: 'article-2'}, {_ref: 'article-3'}], {
        document: {_id: 'drafts.article-1'},
      }),
    ).toContain('cannot be related to itself')
  })

  it('enforces exactly one primary external coverage for external card destination', () => {
    expect(validateExternalCoverage([], {parent: {cardDestination: 'external'}})).toContain(
      'exactly one primary',
    )
    expect(
      validateExternalCoverage([{outlet: 'Press', isPrimary: true}], {parent: {cardDestination: 'external'}}),
    ).toBe(true)
    expect(
      validateExternalCoverage(
        [{outlet: 'Press1', isPrimary: true}, {outlet: 'Press2', isPrimary: false}],
        {parent: {cardDestination: 'external'}},
      ),
    ).toBe(true)
    expect(
      validateExternalCoverage(
        [{outlet: 'Press1', isPrimary: true}, {outlet: 'Press2', isPrimary: true}],
        {parent: {cardDestination: 'external'}},
      ),
    ).toContain('exactly one primary')
  })

  it('allows multiple non-primary external coverage for internal card destination', () => {
    expect(
      validateExternalCoverage(
        [{outlet: 'Press1', isPrimary: false}, {outlet: 'Press2', isPrimary: false}],
        {parent: {cardDestination: 'internal'}},
      ),
    ).toBe(true)
  })

  it('rejects external coverage on non-News articles', () => {
    expect(
      validateExternalCoverage([{outlet: 'Press'}], {
        parent: {articleType: 'editorial'},
      }),
    ).toContain('only available for News')
  })

  it('checks slug uniqueness within the current Article identity', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(1)
    const context = {
      getClient: () => ({fetch}),
      document: {_id: 'drafts.article-1', articleType: 'news'},
    }

    expect(await validateScopedSlugUniqueness({current: 'launch'}, context)).toBe(true)
    expect(await validateScopedSlugUniqueness({current: 'launch'}, context)).toContain(
      'already exists',
    )
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('articleType == $articleType'),
      {
        articleType: 'news',
        slugValue: 'launch',
        publishedId: 'article-1',
        draftId: 'drafts.article-1',
      },
    )
  })
})
