import {describe, expect, it} from 'vitest'
import {
  isFullBleedEligible,
  validateContentLayoutRow,
  validateTwoBlockRowWidths,
} from './contentLayoutContract'
import {contentLayoutMedia} from './contentLayoutMedia'
import {contentLayoutRow} from './contentLayoutRow'
import {contentLayoutText} from './contentLayoutText'
import {schemaTypes} from './index'
import {article} from './article'
import {caseStudyNarrativeSection} from './caseStudyNarrativeSection'
import {caseStudyResults} from './caseStudyResults'

describe('Content Layout Row contract', () => {
  it.each([
    ['1/4', '3/4'],
    ['3/4', '1/4'],
    ['1/3', '2/3'],
    ['2/3', '1/3'],
    ['1/2', '1/2'],
  ])('accepts the complementary pair %s + %s', (first, second) => {
    expect(validateTwoBlockRowWidths([{width: first}, {width: second}])).toBe(true)
  })

  it.each([
    ['1/4', '1/2'],
    ['1/3', '1/3'],
    ['full', 'full'],
  ])('rejects the invalid pair %s + %s', (first, second) => {
    expect(validateTwoBlockRowWidths([{width: first}, {width: second}])).toContain(
      'must total full width',
    )
  })

  it('requires one or two blocks', () => {
    expect(validateContentLayoutRow({blocks: []})).toContain('one or two')
    expect(validateContentLayoutRow({blocks: [{width: 'full'}, {width: '1/2'}, {width: '1/2'}]}))
      .toContain('one or two')
  })

  it('requires explicit widths for every block', () => {
    expect(validateContentLayoutRow({blocks: [{_type: 'contentLayoutText'}]})).toContain(
      'width',
    )
  })

  it('allows alignment for a single narrow block', () => {
    expect(validateContentLayoutRow({
      blocks: [{_type: 'contentLayoutText', width: '1/2'}],
      alignment: 'center',
    })).toBe(true)
  })

  it('identifies only one full-width Media block as full-bleed eligible', () => {
    expect(isFullBleedEligible({
      blocks: [{_type: 'contentLayoutMedia', width: 'full'}],
      fullBleed: true,
    })).toBe(true)
    expect(isFullBleedEligible({
      blocks: [{_type: 'contentLayoutText', width: 'full'}],
      fullBleed: true,
    })).toBe(false)
  })

  it('does not block valid rows when hidden settings retain stale values', () => {
    expect(validateContentLayoutRow({
      blocks: [
        {_type: 'contentLayoutText', width: '1/2'},
        {_type: 'contentLayoutMedia', width: '1/2'},
      ],
      alignment: 'left',
      fullBleed: true,
    })).toBe(true)
  })

  it('registers one-or-two Media or Text blocks and removes legacy layout types', () => {
    const blocks = contentLayoutRow.fields.find((field) => field.name === 'blocks')
    expect(blocks?.type).toBe('array')
    expect(blocks?.of?.map((member) => member.type)).toEqual([
      'contentLayoutMedia',
      'contentLayoutText',
    ])

    const registeredTypes = schemaTypes.map((type) => type.name)
    expect(registeredTypes).toEqual(expect.arrayContaining([
      'contentLayoutRow',
      'contentLayoutMedia',
      'contentLayoutText',
    ]))
    for (const legacyType of [
      'articleTextSection',
      'articleMediaSection',
      'caseStudyFullBleedMedia',
      'caseStudyTextMedia',
      'caseStudyPairedPortraitMedia',
    ]) {
      expect(registeredTypes).not.toContain(legacyType)
    }
  })

  it('makes rows authorable in Article bodies and Case Study sections', () => {
    const articleBody = article.fields.find((field) => field.name === 'body')
    const narrativeLayouts = caseStudyNarrativeSection.fields.find(
      (field) => field.name === 'mediaLayouts',
    )
    const resultsRows = caseStudyResults.fields.find((field) => field.name === 'supportingRows')

    expect(articleBody?.of?.map((member) => member.type)).toEqual(['contentLayoutRow'])
    expect(narrativeLayouts?.of?.map((member) => member.type)).toEqual(['contentLayoutRow'])
    expect(resultsRows?.of?.map((member) => member.type)).toEqual(['contentLayoutRow'])
  })

  it('reuses mediaBox and the global Media Frame aspect ratios', () => {
    expect(contentLayoutMedia.fields.find((field) => field.name === 'media')?.type).toBe('mediaBox')
    const aspectRatio = contentLayoutMedia.fields.find((field) => field.name === 'aspectRatio')
    expect(aspectRatio?.options?.list).toHaveLength(7)
  })

  it('provides optional heading and required rich text with emphasis, links, and lists', () => {
    const heading = contentLayoutText.fields.find((field) => field.name === 'heading')
    const text = contentLayoutText.fields.find((field) => field.name === 'text')
    const block = text?.of?.[0]

    expect(heading?.validation).toBeUndefined()
    expect(text?.validation).toBeTypeOf('function')
    expect(block?.type).toBe('block')
    expect(block?.marks?.decorators?.map((mark) => mark.value)).toEqual(['strong', 'em'])
    expect(block?.marks?.annotations?.map((mark) => mark.name)).toContain('link')
  })
})
