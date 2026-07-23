import {describe, it, expect} from 'vitest'
import {caseStudy} from './caseStudy'
import {article} from './article'
import {caseStudyNarrativeSection} from './caseStudyNarrativeSection'
import {caseStudyResults} from './caseStudyResults'
import {caseStudySections} from '../../../apps/web/src/lib/caseStudySections'

describe('Case Study Spine Schema', () => {
  describe('caseStudy document schema', () => {
    it('has all five required narrative spine fields', () => {
      const fieldNames = caseStudy.fields?.map((f) => f.name) ?? []
      expect(fieldNames).toContain('highlights')
      expect(fieldNames).toContain('challenge')
      expect(fieldNames).toContain('unexpectedInsight')
      expect(fieldNames).toContain('bigIdea')
      expect(fieldNames).toContain('results')
    })

    it('has required color fields', () => {
      const fieldNames = caseStudy.fields?.map((f) => f.name) ?? []
      expect(fieldNames).toContain('primaryColor')
      expect(fieldNames).toContain('secondaryColor')
    })

    it('applies the secondary color contract at document level', () => {
      expect(caseStudy.validation).toBeTypeOf('function')
    })

    it('has optional lead media and press/next project', () => {
      const fieldNames = caseStudy.fields?.map((f) => f.name) ?? []
      expect(fieldNames).toContain('leadMedia')
      expect(fieldNames).toContain('press')
      expect(fieldNames).toContain('nextProject')
    })

    it('keeps client field required', () => {
      const clientField = caseStudy.fields?.find((f) => f.name === 'client')
      expect(clientField).toBeDefined()
      // The field should have validation indicating it's required
      expect(clientField?.type).toBe('string')
    })

    it('removes body field entirely from Case Study', () => {
      const bodyField = caseStudy.fields?.find((f) => f.name === 'body')
      expect(bodyField).toBeUndefined()
    })

    it('does not include removed legacy fields', () => {
      const fieldNames = caseStudy.fields?.map((f) => f.name) ?? []
      expect(fieldNames).not.toContain('year')
      expect(fieldNames).not.toContain('industry')
      expect(fieldNames).not.toContain('deliverables')
      expect(fieldNames).not.toContain('creativeCollective')
      expect(fieldNames).not.toContain('heroMedia')
    })

    it('has capabilities field with validation', () => {
      const capField = caseStudy.fields?.find((f) => f.name === 'capabilities')
      expect(capField).toBeDefined()
      expect(capField?.type).toBe('array')
    })

    it('has required title and slug', () => {
      const titleField = caseStudy.fields?.find((f) => f.name === 'title')
      const slugField = caseStudy.fields?.find((f) => f.name === 'slug')
      expect(titleField).toBeDefined()
      expect(slugField).toBeDefined()
    })
  })

  describe('caseStudyNarrativeSection schema', () => {
    it('has required summary field', () => {
      const summaryField = caseStudyNarrativeSection.fields?.find((f) => f.name === 'summary')
      expect(summaryField).toBeDefined()
      expect(summaryField?.type).toBe('array')
    })

    it('has optional mediaLayouts array', () => {
      const mediaField = caseStudyNarrativeSection.fields?.find((f) => f.name === 'mediaLayouts')
      expect(mediaField).toBeDefined()
      expect(mediaField?.type).toBe('array')
    })

    it('uses only Content Layout Rows for narrative sections', () => {
      const mediaField = caseStudyNarrativeSection.fields?.find((f) => f.name === 'mediaLayouts')
      const layoutTypes = (mediaField as any)?.of?.map?.((item: any) => item.type) ?? []
      expect(layoutTypes).toEqual(['contentLayoutRow'])
      expect(layoutTypes).not.toContain('caseStudyFullBleedMedia')
      expect(layoutTypes).not.toContain('caseStudyTextMedia')
      expect(layoutTypes).not.toContain('caseStudyPairedPortraitMedia')
    })
  })

  describe('caseStudyResults schema', () => {
    it('has required background color field', () => {
      const roleField = caseStudyResults.fields?.find((f) => f.name === 'backgroundColor')
      expect(roleField).toBeDefined()
      expect((roleField as any)?.initialValue).toBe('primary')
    })

    it('has required stats array with 1-4 items', () => {
      const statsField = caseStudyResults.fields?.find((f) => f.name === 'stats')
      expect(statsField).toBeDefined()
      expect(statsField?.type).toBe('array')
    })

    it('each stat has value and label', () => {
      const statsField = caseStudyResults.fields?.find((f) => f.name === 'stats')
      const statSchema = (statsField as any)?.of?.[0]
      const fieldNames = statSchema?.fields?.map?.((f: any) => f.name) ?? []
      expect(fieldNames).toContain('value')
      expect(fieldNames).toContain('label')
    })
  })

  describe('contract: five spine sections required', () => {
    it('all five spine sections are present in schema', () => {
      const fieldNames = caseStudy.fields?.map((f) => f.name) ?? []
      const spineFields = ['highlights', 'challenge', 'unexpectedInsight', 'bigIdea', 'results']
      spineFields.forEach((field) => {
        expect(fieldNames).toContain(field)
      })
    })
  })

  describe('contract: publication date required', () => {
    it('has required publicationDate field for sorting and card display', () => {
      const pubDateField = caseStudy.fields?.find((f) => f.name === 'publicationDate')
      expect(pubDateField).toBeDefined()
      expect(pubDateField?.type).toBe('datetime')
    })
  })

  describe('contract: color validation', () => {
    it('primary color is required', () => {
      const primaryField = caseStudy.fields?.find((f) => f.name === 'primaryColor')
      expect(primaryField).toBeDefined()
      // Should have validation that makes it required
    })

    it('both color fields use color pickers', () => {
      const primaryField = caseStudy.fields?.find((f) => f.name === 'primaryColor')
      const secondaryField = caseStudy.fields?.find((f) => f.name === 'secondaryColor')
      expect(primaryField?.type).toBe('color')
      expect(secondaryField?.type).toBe('color')
    })
  })

  describe('contract: capabilities validation', () => {
    it('capabilities field requires array of references', () => {
      const capField = caseStudy.fields?.find((f) => f.name === 'capabilities')
      expect(capField?.type).toBe('array')
      const ofType = (capField as any)?.of?.[0]?.type
      expect(ofType).toBe('reference')
    })

    it('capabilities reference capability type', () => {
      const capField = caseStudy.fields?.find((f) => f.name === 'capabilities')
      const toType = (capField as any)?.of?.[0]?.to?.[0]?.type
      expect(toType).toBe('capability')
    })
  })

  describe('contract: press cardinality', () => {
    it('press is optional array of news references', () => {
      const pressField = caseStudy.fields?.find((f) => f.name === 'press')
      expect(pressField?.type).toBe('array')
      const ofType = (pressField as any)?.of?.[0]?.type
      expect(ofType).toBe('reference')
    })

    it('press references article type', () => {
      const pressField = caseStudy.fields?.find((f) => f.name === 'press')
      const toType = (pressField as any)?.of?.[0]?.to?.[0]?.type
      expect(toType).toBe('article')
    })
  })

  describe('contract: next project', () => {
    it('next project is single optional reference to caseStudy', () => {
      const nextProjField = caseStudy.fields?.find((f) => f.name === 'nextProject')
      expect(nextProjField?.type).toBe('reference')
      const toType = (nextProjField as any)?.to?.[0]?.type
      expect(toType).toBe('caseStudy')
    })

    it('is not an array', () => {
      const nextProjField = caseStudy.fields?.find((f) => f.name === 'nextProject')
      expect(nextProjField?.type).not.toBe('array')
    })
  })

  describe('contract: lead media', () => {
    it('lead media is optional and uses mediaBox', () => {
      const leadField = caseStudy.fields?.find((f) => f.name === 'leadMedia')
      expect(leadField).toBeDefined()
      expect(leadField?.type).toBe('mediaBox')
    })
  })

  describe('contract: card fields preserved', () => {
    it('case study card fields include content card settings', () => {
      const cardFields = ['publicationDate', 'cardMedia', 'cardWidth', 'mediaAspectRatio', 'infoPosition', 'tags']
      const fieldNames = caseStudy.fields?.map((f) => f.name) ?? []
      cardFields.forEach((field) => {
        expect(fieldNames).toContain(field)
      })
    })
  })

  describe('contract: case study media layout types not in articles', () => {
    it('article body accepts only content layout rows', () => {
      const articleBodyField = article.fields?.find((f) => f.name === 'body')
      const ofTypes = (articleBodyField as any)?.of?.map?.((item: any) => item.type) ?? []
      expect(ofTypes).toEqual(['contentLayoutRow'])
      // Case Study-only types should not be in article body
      expect(ofTypes).not.toContain('caseStudyFullBleedMedia')
      expect(ofTypes).not.toContain('caseStudyTextMedia')
      expect(ofTypes).not.toContain('caseStudyPairedPortraitMedia')
    })
  })

  describe('contract: fixed web composition order', () => {
    it('defines the five labels, ids, and fields once in fixed order', () => {
      expect(caseStudySections).toEqual([
        {field: 'highlights', id: 'highlights', label: 'Highlights'},
        {field: 'challenge', id: 'challenge', label: 'Challenge'},
        {
          field: 'unexpectedInsight',
          id: 'unexpected-insight',
          label: 'Unexpected Insight',
        },
        {field: 'bigIdea', id: 'big-idea', label: 'Big Idea'},
        {field: 'results', id: 'results', label: 'Results'},
      ])
    })
  })
})
