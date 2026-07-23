type MediaBox = Record<string, unknown>

export type LegacyArticleBlock =
  | {
      _type: 'articleTextSection'
      _key: string
      heading?: string
      text?: unknown[]
    }
  | {
      _type: 'articleMediaSection'
      _key: string
      layout?: 'full-width' | 'editorial-rail' | 'paired'
      media?: MediaBox
      pairedMedia?: MediaBox[]
    }

export const migrateLegacyArticleBlock = (block: LegacyArticleBlock) => {
  if (block._type === 'articleTextSection') {
    return {
      _type: 'contentLayoutRow',
      _key: block._key,
      blocks: [
        {
          _type: 'contentLayoutText',
          _key: `${block._key}-text`,
          width: 'full',
          ...(block.heading ? {heading: block.heading} : {}),
          text: block.text,
        },
      ],
    }
  }

  const media = block.layout === 'paired' ? block.pairedMedia : block.media ? [block.media] : []
  if (media?.length !== (block.layout === 'paired' ? 2 : 1)) {
    throw new Error(`Article media block ${block._key} has incomplete media.`)
  }

  const width = block.layout === 'paired' ? '1/2' : block.layout === 'editorial-rail' ? '2/3' : 'full'
  const aspectRatio = block.layout === 'editorial-rail' ? '3:2' : '16:9'
  return {
    _type: 'contentLayoutRow',
    _key: block._key,
    blocks: media.map((item, index) => ({
      _type: 'contentLayoutMedia',
      _key: `${block._key}-media-${index + 1}`,
      width,
      media: item,
      aspectRatio,
    })),
    ...(block.layout === 'editorial-rail' ? {alignment: 'center'} : {}),
  }
}
