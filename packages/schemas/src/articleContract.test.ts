import {describe, expect, it, vi} from 'vitest'
import {
  validateArticleBody,
  validateRelatedItems,
  validateScopedSlugUniqueness,
} from './articleContract'

describe('Article contract validators', () => {
  it('requires a body for editorial and zine articles, but not news', () => {
    expect(validateArticleBody([])).toContain('required')
    expect(validateArticleBody([], {document: {articleType: 'editorial'}})).toContain('required')
    expect(validateArticleBody([], {document: {articleType: 'zine'}})).toContain('required')
    expect(validateArticleBody(undefined, {document: {articleType: 'news'}})).toBe(true)
    expect(validateArticleBody([], {document: {articleType: 'news'}})).toBe(true)
    expect(
      validateArticleBody([
        {_type: 'contentLayoutRow', blocks: [{_type: 'contentLayoutText', width: 'full'}]}],
      ),
    ).toBe(true)
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

  it('scopes slug uniqueness across the shared News/Editorial route', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(1)
    const context = {
      getClient: () => ({fetch}),
      document: {_id: 'drafts.article-1', articleType: 'news'},
    }

    expect(await validateScopedSlugUniqueness({current: 'launch'}, context)).toBe(true)
    expect(await validateScopedSlugUniqueness({current: 'launch'}, context)).toContain(
      'already exists',
    )
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('articleType in $scopeTypes'), {
      scopeTypes: ['news', 'editorial'],
      slugValue: 'launch',
      publishedId: 'article-1',
      draftId: 'drafts.article-1',
    })
  })

  it('scopes Zine slug uniqueness to zine articles only', async () => {
    const fetch = vi.fn().mockResolvedValue(0)
    const context = {
      getClient: () => ({fetch}),
      document: {_id: 'drafts.article-2', articleType: 'zine'},
    }

    expect(await validateScopedSlugUniqueness({current: 'launch'}, context)).toBe(true)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('articleType in $scopeTypes'), {
      scopeTypes: ['zine'],
      slugValue: 'launch',
      publishedId: 'article-2',
      draftId: 'drafts.article-2',
    })
  })
})
