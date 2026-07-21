import {describe, expect, it} from 'vitest'
import {
  validateArticleBody,
  validateNewsContent,
  validateRelatedItems,
} from './articleContract'

describe('Article contract validators', () => {
  it('requires editorial bodies to contain content', () => {
    expect(validateArticleBody([], {document: {articleType: 'editorial'}})).toContain('required')
    expect(
      validateArticleBody(
        [{_type: 'articleTextSection', text: [{children: [{text: 'A story'}]}]}],
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
})
