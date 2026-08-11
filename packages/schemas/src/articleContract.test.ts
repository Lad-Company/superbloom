import {describe, expect, it, vi} from 'vitest'
import {
  validateArticleBody,
  validateCardCtaLabel,
  validateRelatedItems,
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

  it('does not require News articles to have a body', () => {
    expect(validateArticleBody([], {document: {articleType: 'news'}})).toBe(true)
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

  it('only requires a card CTA label for Zine articles', () => {
    expect(validateCardCtaLabel(undefined, {document: {articleType: 'news'}})).toBe(true)
    expect(validateCardCtaLabel(undefined, {document: {articleType: 'editorial'}})).toBe(true)
    expect(validateCardCtaLabel(undefined, {document: {articleType: 'zine'}})).toContain('required')
    expect(validateCardCtaLabel('Read more', {document: {articleType: 'zine'}})).toBe(true)
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
