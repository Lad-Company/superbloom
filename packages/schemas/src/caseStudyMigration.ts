type MediaBox = Record<string, unknown>

export type LegacyCaseStudyBlock =
  | {
      _type: 'caseStudyFullBleedMedia'
      _key: string
      mediaBox?: MediaBox
    }
  | {
      _type: 'caseStudyTextMedia'
      _key: string
      text?: unknown[]
      mediaBox?: MediaBox
      mediaPosition?: 'left' | 'right'
      mediaWidth?: 'half' | 'three-quarters'
    }
  | {
      _type: 'caseStudyPairedPortraitMedia'
      _key: string
      mediaBoxes?: MediaBox[]
    }

export const migrateLegacyCaseStudyBlock = (block: LegacyCaseStudyBlock) => {
  if (block._type === 'caseStudyFullBleedMedia') {
    if (!block.mediaBox) {
      throw new Error(`Case Study full bleed media block ${block._key} has no media.`)
    }

    return {
      _type: 'contentLayoutRow',
      _key: block._key,
      blocks: [
        {
          _type: 'contentLayoutMedia',
          _key: `${block._key}-media`,
          width: 'full',
          media: block.mediaBox,
          aspectRatio: '16:9',
        },
      ],
      fullBleed: true,
    }
  }

  if (block._type === 'caseStudyTextMedia') {
    if (!block.text || !block.mediaBox || !block.mediaPosition) {
      throw new Error(
        `Case Study text+media block ${block._key} has incomplete fields.`,
      )
    }

    const mediaWidth = block.mediaWidth === 'half' ? '1/2' : '3/4'
    const textWidth = mediaWidth === '1/2' ? '1/2' : '1/4'

    const textBlock = {
      _type: 'contentLayoutText',
      _key: `${block._key}-text`,
      width: textWidth,
      text: block.text,
    }

    const mediaBlock = {
      _type: 'contentLayoutMedia',
      _key: `${block._key}-media`,
      width: mediaWidth,
      media: block.mediaBox,
      aspectRatio: '16:9',
    }

    const blocks =
      block.mediaPosition === 'left' ? [mediaBlock, textBlock] : [textBlock, mediaBlock]

    return {
      _type: 'contentLayoutRow',
      _key: block._key,
      blocks,
    }
  }

  if (block._type === 'caseStudyPairedPortraitMedia') {
    if (!block.mediaBoxes || block.mediaBoxes.length !== 2) {
      throw new Error(
        `Case Study paired portrait block ${block._key} does not have exactly 2 media items.`,
      )
    }

    return {
      _type: 'contentLayoutRow',
      _key: block._key,
      blocks: [
        {
          _type: 'contentLayoutMedia',
          _key: `${block._key}-media-1`,
          width: '1/2',
          media: block.mediaBoxes[0],
          aspectRatio: '4:5',
        },
        {
          _type: 'contentLayoutMedia',
          _key: `${block._key}-media-2`,
          width: '1/2',
          media: block.mediaBoxes[1],
          aspectRatio: '4:5',
        },
      ],
    }
  }

  const unknownBlock = block as {_type?: string}
  throw new Error(`Unknown legacy Case Study block type: ${unknownBlock._type ?? 'missing'}`)
}
