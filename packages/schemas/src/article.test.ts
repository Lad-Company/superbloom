import {describe, it, expect} from 'vitest'
import {article} from './article'

describe('Article Schema', () => {
  describe('contract: publication date editable', () => {
    it('exposes publicationDate as a visible, editable datetime for sorting and card display', () => {
      const pubDateField = article.fields?.find((f) => f.name === 'publicationDate') as
        Record<string, unknown> | undefined
      expect(pubDateField).toBeDefined()
      expect(pubDateField?.type).toBe('datetime')
      expect(pubDateField?.hidden).toBeFalsy()
      expect(pubDateField?.readOnly).toBeFalsy()
    })
  })
})
