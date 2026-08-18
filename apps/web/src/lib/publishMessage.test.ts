import {describe, expect, it, vi} from 'vitest'
import {createIdempotencyCache, fetchZineIssueSlug, renderPublishMessage} from './publishMessage'

vi.mock('./sanity', () => ({
  sanityClient: {
    withConfig: vi.fn(() => ({fetch: vi.fn().mockResolvedValue('issue-no-5')})),
  },
}))

describe('renderPublishMessage', () => {
  it('renders a new case study with its work path', () => {
    expect(
      renderPublishMessage({
        _type: 'caseStudy',
        operation: 'create',
        title: 'Brand X Campaign',
        slug: 'brand-x',
      }),
    ).toBe("New Case Study published — 'Brand X Campaign' · /work/brand-x")
  })

  it('renders article updates with the articleType label', () => {
    expect(
      renderPublishMessage({
        _type: 'article',
        operation: 'update',
        title: 'Studio News',
        slug: 'studio-news',
        articleType: 'editorial',
      }),
    ).toBe("Editorial updated — 'Studio News' · /articles/studio-news")
    expect(
      renderPublishMessage({_type: 'article', operation: 'create', title: 'Press', slug: 'press', articleType: 'news'}),
    ).toBe("New News Article published — 'Press' · /articles/press")
  })

  it('renders zine articles with the resolved issue path, falling back to /zine', () => {
    expect(
      renderPublishMessage({
        _type: 'article',
        operation: 'create',
        title: 'Story',
        slug: 'story',
        articleType: 'zine',
        issueSlug: 'issue-no-5',
      }),
    ).toBe("New Zine Article published — 'Story' · /zine/issues/issue-no-5/story")
    expect(
      renderPublishMessage({
        _type: 'article',
        operation: 'create',
        title: 'Story',
        slug: 'story',
        articleType: 'zine',
        issueSlug: null,
      }),
    ).toBe("New Zine Article published — 'Story' · /zine")
  })

  it('renders deletes without a link', () => {
    expect(
      renderPublishMessage({_type: 'caseStudy', operation: 'delete', title: 'Old Work', slug: 'old-work'}),
    ).toBe("Case Study unpublished or deleted — 'Old Work'")
  })

  it('renders singletons by label with their fixed path', () => {
    expect(renderPublishMessage({_type: 'homepage', operation: 'update'})).toBe('Homepage updated — /')
    expect(renderPublishMessage({_type: 'zineLanding', operation: 'update'})).toBe(
      'Zine Landing updated — /zine',
    )
  })

  it('renders linkless types without a path', () => {
    expect(renderPublishMessage({_type: 'siteSettings', operation: 'update'})).toBe(
      'Site Settings updated',
    )
    expect(renderPublishMessage({_type: 'tag', operation: 'create', title: 'Rooftops'})).toBe(
      "New Tag published — 'Rooftops'",
    )
  })

  it('drops types outside the allowlist', () => {
    expect(renderPublishMessage({_type: 'formSubmission', operation: 'create', title: 'x'})).toBeNull()
    expect(renderPublishMessage({_type: 'mediaBox', operation: 'update'})).toBeNull()
  })
})

describe('fetchZineIssueSlug', () => {
  it('queries the issue holding the article, bypassing the CDN', async () => {
    await expect(fetchZineIssueSlug('article-1')).resolves.toBe('issue-no-5')
  })
})

describe('createIdempotencyCache', () => {
  it('flags repeats within the TTL and forgets them after', () => {
    const isDuplicate = createIdempotencyCache(1000)
    expect(isDuplicate('key', 100)).toBe(false)
    expect(isDuplicate('key', 200)).toBe(true)
    expect(isDuplicate('key', 1201)).toBe(false)
  })
})
