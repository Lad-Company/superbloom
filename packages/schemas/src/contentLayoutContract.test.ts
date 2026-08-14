import {describe, expect, it} from 'vitest'
import {
  isFullBleedEligible,
  validateContentLayoutRow,
  validateRowBlockWidths,
} from './contentLayoutContract'
import {contentLayoutCarousel} from './contentLayoutCarousel'
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
    expect(validateRowBlockWidths([{width: first}, {width: second}])).toBe(true)
  })

  it.each([
    ['1/4', '1/2'],
    ['1/3', '1/3'],
    ['full', 'full'],
  ])('rejects the invalid pair %s + %s', (first, second) => {
    expect(validateRowBlockWidths([{width: first}, {width: second}])).toContain(
      'must total full width',
    )
  })

  it('requires between one and four blocks', () => {
    expect(validateContentLayoutRow({blocks: []})).toContain('between one and four')
    expect(validateContentLayoutRow({
      blocks: [
        {width: '1/4'},
        {width: '1/4'},
        {width: '1/4'},
        {width: '1/4'},
        {width: '1/4'},
      ],
    })).toContain('between one and four')
  })

  it('accepts multi-block rows whose widths total full width', () => {
    // Spacer-led row: pushes the media pair right so it aligns under the
    // narrative section copy (columns 5-12).
    expect(validateContentLayoutRow({
      blocks: [
        {_type: 'contentLayoutSpacer', width: '1/3'},
        {_type: 'contentLayoutMedia', width: '1/3'},
        {_type: 'contentLayoutMedia', width: '1/3'},
      ],
    })).toBe(true)
    // Three-column media grid.
    expect(validateContentLayoutRow({
      blocks: [
        {_type: 'contentLayoutMedia', width: '1/3'},
        {_type: 'contentLayoutMedia', width: '1/3'},
        {_type: 'contentLayoutMedia', width: '1/3'},
      ],
    })).toBe(true)
    // Four-column media grid.
    expect(validateContentLayoutRow({
      blocks: [
        {_type: 'contentLayoutMedia', width: '1/4'},
        {_type: 'contentLayoutMedia', width: '1/4'},
        {_type: 'contentLayoutMedia', width: '1/4'},
        {_type: 'contentLayoutMedia', width: '1/4'},
      ],
    })).toBe(true)
    // Mixed text + media triples are fine too.
    expect(validateContentLayoutRow({
      blocks: [
        {_type: 'contentLayoutText', width: '1/3'},
        {_type: 'contentLayoutMedia', width: '1/3'},
        {_type: 'contentLayoutMedia', width: '1/3'},
      ],
    })).toBe(true)
  })

  it('rejects multi-block rows whose widths do not total full width', () => {
    expect(validateContentLayoutRow({
      blocks: [
        {_type: 'contentLayoutSpacer', width: '1/3'},
        {_type: 'contentLayoutMedia', width: '1/3'},
        {_type: 'contentLayoutMedia', width: '1/4'},
      ],
    })).toContain('must total full width')
    expect(validateContentLayoutRow({
      blocks: [
        {_type: 'contentLayoutMedia', width: '1/4'},
        {_type: 'contentLayoutMedia', width: '1/4'},
        {_type: 'contentLayoutMedia', width: '1/4'},
        {_type: 'contentLayoutMedia', width: '1/3'},
      ],
    })).toContain('must total full width')
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

  it('registers Media, Text, Spacer, and Video Carousel blocks and removes legacy layout types', () => {
    const blocks = contentLayoutRow.fields.find((field) => field.name === 'blocks')
    expect(blocks?.type).toBe('array')
    const ofType = (blocks as {of?: Array<{type: string}>} | undefined)?.of
    expect(ofType?.map((member) => member.type)).toEqual([
      'contentLayoutMedia',
      'contentLayoutText',
      'contentLayoutSpacer',
      'contentLayoutCarousel',
    ])

    const registeredTypes = schemaTypes.map((type) => type.name)
    expect(registeredTypes).toEqual(expect.arrayContaining([
      'contentLayoutRow',
      'contentLayoutMedia',
      'contentLayoutText',
      'contentLayoutSpacer',
      'contentLayoutCarousel',
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

    const bodyOf = (articleBody as {of?: Array<{type: string}>} | undefined)?.of
    const narrativeOf = (narrativeLayouts as {of?: Array<{type: string}>} | undefined)?.of
    const resultsOf = (resultsRows as {of?: Array<{type: string}>} | undefined)?.of

    expect(bodyOf?.map((member) => member.type)).toEqual(['contentLayoutRow'])
    expect(narrativeOf?.map((member) => member.type)).toEqual(['contentLayoutRow'])
    expect(resultsOf?.map((member) => member.type)).toEqual(['contentLayoutRow'])
  })

  it('allows a lone Video Carousel block with no width', () => {
    expect(validateContentLayoutRow({
      blocks: [{_type: 'contentLayoutCarousel'}],
    })).toBe(true)
  })

  it('rejects a Video Carousel sharing its row, from either validator', () => {
    const row = {
      blocks: [
        {_type: 'contentLayoutCarousel'},
        {_type: 'contentLayoutText', width: '1/2'},
      ],
    }
    expect(validateContentLayoutRow(row)).toContain('spans the full row')
    // The blocks-array validator defers to the row validator's message.
    expect(validateRowBlockWidths(row.blocks)).toBe(true)
  })

  it('gives the Video Carousel Block videos and no width control', () => {
    const fieldNames = contentLayoutCarousel.fields.map((field) => field.name)
    expect(fieldNames).not.toContain('width')
    const videos = contentLayoutCarousel.fields.find((field) => field.name === 'videos')
    expect(videos?.type).toBe('array')
    expect((videos as {of?: Array<{type: string}>} | undefined)?.of?.map((member) => member.type))
      .toEqual(['mediaBox'])
    expect(videos?.validation).toBeTypeOf('function')
  })

  it('reuses mediaBox and the global Media Frame aspect ratios', () => {
    expect(contentLayoutMedia.fields.find((field) => field.name === 'media')?.type).toBe('mediaBox')
    const aspectRatio = contentLayoutMedia.fields.find((field) => field.name === 'aspectRatio')
    const list = (aspectRatio?.options as {list?: unknown[]} | undefined)?.list
    expect(list).toHaveLength(7)
  })

  it('provides required rich text with emphasis, links, and lists and no heading field', () => {
    const fieldNames = contentLayoutText.fields.map((field) => field.name)
    const text = contentLayoutText.fields.find((field) => field.name === 'text')
    const block = (text as {of?: Array<{type: string; marks?: unknown}>} | undefined)?.of?.[0]

    expect(fieldNames).not.toContain('heading')
    expect(text?.validation).toBeTypeOf('function')
    expect(block?.type).toBe('block')
    const marks = block?.marks as
      | {decorators?: Array<{value: string}>; annotations?: Array<{name: string}>}
      | undefined
    expect(marks?.decorators?.map((mark) => mark.value)).toEqual(['strong', 'em'])
    expect(marks?.annotations?.map((mark) => mark.name)).toContain('link')
  })
})
