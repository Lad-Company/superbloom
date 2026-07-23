import {describe, it, expect, vi} from 'vitest'
import {
  isValidHexColor,
  validateColorRequired,
  validateSecondaryColorWithResults,
  validateCapabilitiesUnique,
  validateCapabilitiesCardinality,
  validatePressUnique,
  validatePressCardinality,
  validatePressNewsReferences,
  validateNextProjectNotSelf,
  validateStatsCardinality,
  validateStatComplete,
  validatePortableTextNonEmpty,
} from './caseStudyContract'

describe('Case Study Contract Validators', () => {
  describe('isValidHexColor', () => {
    it('accepts valid six-digit hex colors', () => {
      expect(isValidHexColor('#fdd143')).toBe(true)
      expect(isValidHexColor('#cb122d')).toBe(true)
      expect(isValidHexColor('#000000')).toBe(true)
      expect(isValidHexColor('#ffffff')).toBe(true)
      expect(isValidHexColor('#FFFFFF')).toBe(true)
    })

    it('rejects invalid hex colors', () => {
      expect(isValidHexColor('#fff')).toBe(false)
      expect(isValidHexColor('#gggggg')).toBe(false)
      expect(isValidHexColor('fdd143')).toBe(false)
      expect(isValidHexColor('#fdd14')).toBe(false)
      expect(isValidHexColor('#fdd1433')).toBe(false)
      expect(isValidHexColor('')).toBe(false)
      expect(isValidHexColor(null)).toBe(false)
      expect(isValidHexColor(undefined)).toBe(false)
    })
  })

  describe('validateColorRequired', () => {
    it('returns true for valid hex colors', () => {
      expect(validateColorRequired('#fdd143')).toBe(true)
    })

    it('returns error message for invalid colors', () => {
      const result = validateColorRequired('#fff')
      expect(typeof result).toBe('string')
      expect(result).toContain('hex')
    })
  })

  describe('validateSecondaryColorWithResults', () => {
    it('allows secondary color to be missing for the primary background', () => {
      const context = {
        parent: {
          secondaryColor: undefined,
          results: {backgroundColor: 'primary'},
        },
      }
      expect(validateSecondaryColorWithResults(context)).toBe(true)
    })

    it('requires secondary color for the secondary background', () => {
      const context = {
        parent: {
          secondaryColor: undefined,
          results: {backgroundColor: 'secondary'},
        },
      }
      const result = validateSecondaryColorWithResults(context)
      expect(typeof result).toBe('string')
      expect(result).toContain('required')
    })

    it('accepts a valid secondary color for the secondary background', () => {
      const context = {
        parent: {
          secondaryColor: '#cb122d',
          results: {backgroundColor: 'secondary'},
        },
      }
      expect(validateSecondaryColorWithResults(context)).toBe(true)
    })
  })

  describe('validateCapabilitiesUnique', () => {
    it('returns true for empty or non-array', () => {
      expect(validateCapabilitiesUnique(undefined)).toBe(true)
      expect(validateCapabilitiesUnique([])).toBe(true)
    })

    it('rejects duplicate capability refs', () => {
      const capabilities = [
        {_ref: 'cap-1'},
        {_ref: 'cap-1'},
      ]
      const result = validateCapabilitiesUnique(capabilities)
      expect(typeof result).toBe('string')
      expect(result).toContain('unique')
    })

    it('accepts unique capability refs', () => {
      const capabilities = [
        {_ref: 'cap-1'},
        {_ref: 'cap-2'},
        {_ref: 'cap-3'},
      ]
      expect(validateCapabilitiesUnique(capabilities)).toBe(true)
    })
  })

  describe('validateCapabilitiesCardinality', () => {
    it('rejects non-array', () => {
      const result = validateCapabilitiesCardinality(null)
      expect(typeof result).toBe('string')
      expect(result).toContain('array')
    })

    it('rejects empty capabilities', () => {
      const result = validateCapabilitiesCardinality([])
      expect(typeof result).toBe('string')
      expect(result).toContain('1–6')
    })

    it('rejects more than 6 capabilities', () => {
      const capabilities = Array.from({length: 7}, (_, i) => ({_ref: `cap-${i}`}))
      const result = validateCapabilitiesCardinality(capabilities)
      expect(typeof result).toBe('string')
      expect(result).toContain('1–6')
    })

    it('accepts 1-6 capabilities', () => {
      for (let i = 1; i <= 6; i++) {
        const capabilities = Array.from({length: i}, (_, j) => ({_ref: `cap-${j}`}))
        expect(validateCapabilitiesCardinality(capabilities)).toBe(true)
      }
    })
  })

  describe('validatePressUnique', () => {
    it('returns true for empty or non-array', () => {
      expect(validatePressUnique(undefined)).toBe(true)
      expect(validatePressUnique([])).toBe(true)
    })

    it('rejects duplicate press refs', () => {
      const press = [
        {_ref: 'news-1'},
        {_ref: 'news-1'},
      ]
      const result = validatePressUnique(press)
      expect(typeof result).toBe('string')
      expect(result).toContain('unique')
    })

    it('accepts unique press refs', () => {
      const press = [
        {_ref: 'news-1'},
        {_ref: 'news-2'},
        {_ref: 'news-3'},
      ]
      expect(validatePressUnique(press)).toBe(true)
    })
  })

  describe('validatePressCardinality', () => {
    it('accepts undefined (optional)', () => {
      expect(validatePressCardinality(undefined)).toBe(true)
    })

    it('accepts null (optional)', () => {
      expect(validatePressCardinality(null)).toBe(true)
    })

    it('rejects non-array after null check', () => {
      const result = validatePressCardinality('invalid')
      expect(typeof result).toBe('string')
      expect(result).toContain('array')
    })

    it('rejects more than 3 press items', () => {
      const press = Array.from({length: 4}, (_, i) => ({_ref: `news-${i}`}))
      const result = validatePressCardinality(press)
      expect(typeof result).toBe('string')
      expect(result).toContain('three')
    })

    it('accepts 0-3 press items', () => {
      for (let i = 0; i <= 3; i++) {
        const press = Array.from({length: i}, (_, j) => ({_ref: `news-${j}`}))
        expect(validatePressCardinality(press)).toBe(true)
      }
    })
  })

  describe('validatePressNewsReferences', () => {
    it('accepts Press references that all resolve to News', async () => {
      const fetch = vi.fn().mockResolvedValue([
        {_id: 'news-1', articleType: 'news'},
        {_id: 'news-2', articleType: 'news'},
      ])

      await expect(
        validatePressNewsReferences(
          [{_ref: 'news-1'}, {_ref: 'news-2'}],
          {getClient: () => ({fetch})},
        ),
      ).resolves.toBe(true)
    })

    it('rejects non-News and unresolved Press references', async () => {
      const fetch = vi.fn().mockResolvedValue([
        {_id: 'article-1', articleType: 'editorial'},
      ])

      await expect(
        validatePressNewsReferences(
          [{_ref: 'article-1'}, {_ref: 'missing'}],
          {getClient: () => ({fetch})},
        ),
      ).resolves.toContain('resolve to a News item')
    })
  })

  describe('validateNextProjectNotSelf', () => {
    it('allows empty next project', () => {
      const context = {document: {_id: 'case-123'}}
      expect(validateNextProjectNotSelf(undefined, context)).toBe(true)
      expect(validateNextProjectNotSelf(null, context)).toBe(true)
    })

    it('rejects self-reference', () => {
      const nextProject = {_ref: 'case-123'}
      const context = {document: {_id: 'case-123'}}
      const result = validateNextProjectNotSelf(nextProject, context)
      expect(typeof result).toBe('string')
      expect(result).toContain('cannot')
    })

    it('normalizes draft prefix on both current and reference', () => {
      const nextProject = {_ref: 'case-456'}
      const context = {document: {_id: 'drafts.case-456'}}
      const result = validateNextProjectNotSelf(nextProject, context)
      expect(typeof result).toBe('string')
      expect(result).toContain('cannot')
    })

    it('normalizes draft prefix on reference only', () => {
      const nextProject = {_ref: 'drafts.case-456'}
      const context = {document: {_id: 'case-456'}}
      const result = validateNextProjectNotSelf(nextProject, context)
      expect(typeof result).toBe('string')
      expect(result).toContain('cannot')
    })

    it('normalizes draft prefix on both', () => {
      const nextProject = {_ref: 'drafts.case-123'}
      const context = {document: {_id: 'drafts.case-123'}}
      const result = validateNextProjectNotSelf(nextProject, context)
      expect(typeof result).toBe('string')
      expect(result).toContain('cannot')
    })

    it('accepts reference to different case study after normalization', () => {
      const nextProject = {_ref: 'case-456'}
      const context = {document: {_id: 'case-123'}}
      expect(validateNextProjectNotSelf(nextProject, context)).toBe(true)
    })
  })

  describe('validateStatsCardinality', () => {
    it('rejects non-array', () => {
      const result = validateStatsCardinality(null)
      expect(typeof result).toBe('string')
      expect(result).toContain('array')
    })

    it('rejects empty stats', () => {
      const result = validateStatsCardinality([])
      expect(typeof result).toBe('string')
      expect(result).toContain('1–4')
    })

    it('rejects more than 4 stats', () => {
      const stats = Array.from({length: 5}, (_, i) => ({value: `val${i}`, label: `label${i}`}))
      const result = validateStatsCardinality(stats)
      expect(typeof result).toBe('string')
      expect(result).toContain('1–4')
    })

    it('accepts 1-4 stats', () => {
      for (let i = 1; i <= 4; i++) {
        const stats = Array.from({length: i}, (_, j) => ({value: `val${j}`, label: `label${j}`}))
        expect(validateStatsCardinality(stats)).toBe(true)
      }
    })
  })

  describe('validateStatComplete', () => {
    it('rejects non-object', () => {
      const result = validateStatComplete(null)
      expect(typeof result).toBe('string')
      expect(result).toContain('object')
    })

    it('rejects stat without value', () => {
      const stat = {label: 'label'}
      const result = validateStatComplete(stat)
      expect(typeof result).toBe('string')
      expect(result).toContain('value')
    })

    it('rejects stat without label', () => {
      const stat = {value: 'value'}
      const result = validateStatComplete(stat)
      expect(typeof result).toBe('string')
      expect(result).toContain('label')
    })

    it('accepts complete stat', () => {
      const stat = {value: '+237%', label: 'Organic Reach'}
      expect(validateStatComplete(stat)).toBe(true)
    })
  })

  describe('validatePortableTextNonEmpty', () => {
    it('rejects non-array', () => {
      const result = validatePortableTextNonEmpty(null)
      expect(typeof result).toBe('string')
      expect(result).toContain('required')
    })

    it('rejects empty array', () => {
      const result = validatePortableTextNonEmpty([])
      expect(typeof result).toBe('string')
      expect(result).toContain('required')
    })

    it('rejects array with empty blocks', () => {
      const portableText = [
        {
          _type: 'block',
          children: [],
        },
      ]
      const result = validatePortableTextNonEmpty(portableText)
      expect(typeof result).toBe('string')
      expect(result).toContain('required')
    })

    it('rejects array with blocks containing only whitespace', () => {
      const portableText = [
        {
          _type: 'block',
          children: [{_type: 'span', text: '   '}],
        },
      ]
      const result = validatePortableTextNonEmpty(portableText)
      expect(typeof result).toBe('string')
      expect(result).toContain('required')
    })

    it('accepts array with text content', () => {
      const portableText = [
        {
          _type: 'block',
          children: [{_type: 'span', text: 'Some content here'}],
        },
      ]
      expect(validatePortableTextNonEmpty(portableText)).toBe(true)
    })

    it('accepts array with multiple blocks containing content', () => {
      const portableText = [
        {
          _type: 'block',
          children: [{_type: 'span', text: 'First paragraph'}],
        },
        {
          _type: 'block',
          children: [{_type: 'span', text: 'Second paragraph'}],
        },
      ]
      expect(validatePortableTextNonEmpty(portableText)).toBe(true)
    })
  })
})
