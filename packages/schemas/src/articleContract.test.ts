import {describe, expect, it} from 'vitest'
import {
  validateArticleBody,
  validateExternalCoverage,
  validateNewsContent,
  validateRelatedItems,
} from './articleContract'

describe('Article contract validators', () => {
  it('requires editorial bodies to contain content', () => {
    expect(validateArticleBody([], {document: {_type: 'editorialArticle'}})).toContain('required')
    expect(
      validateArticleBody(
        [{_type: 'articleTextSection', text: [{children: [{text: 'A story'}]}]}],
        {document: {_type: 'editorialArticle'}},
      ),
    ).toBe(true)
  })

  it('allows News without a body only when it has coverage', () => {
    expect(
      validateArticleBody([], {document: {_type: 'news', externalCoverage: [{outlet: 'Press'}]}}),
    ).toBe(true)
    expect(validateArticleBody([], {document: {_type: 'news'}})).toContain('body or external coverage')
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

  it('requires a single primary coverage link for external News cards', () => {
    expect(validateExternalCoverage([{isPrimary: true}], {parent: {cardDestination: 'external'}})).toBe(true)
    expect(validateExternalCoverage([], {parent: {cardDestination: 'external'}})).toContain('exactly one')
    expect(validateExternalCoverage([{isPrimary: true}, {isPrimary: true}], {parent: {cardDestination: 'external'}})).toContain('exactly one')
  })
})
