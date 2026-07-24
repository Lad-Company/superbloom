export const CONTENT_LAYOUT_WIDTHS = ['1/4', '1/3', '1/2', '2/3', '3/4', 'full'] as const
export type ContentLayoutWidth = (typeof CONTENT_LAYOUT_WIDTHS)[number]
export type ContentLayoutAlignment = 'left' | 'center' | 'right'

type ContentLayoutBlock = {
  _type?: string
  width?: string
}

type ContentLayoutRow = {
  blocks?: ContentLayoutBlock[]
  alignment?: string
  fullBleed?: boolean
}

const WIDTH_VALUES: Record<string, number> = {
  '1/4': 1 / 4,
  '1/3': 1 / 3,
  '1/2': 1 / 2,
  '2/3': 2 / 3,
  '3/4': 3 / 4,
  full: 1,
}

export const validateTwoBlockRowWidths = (blocks: unknown): string | boolean => {
  if (!Array.isArray(blocks) || blocks.length !== 2) return true

  const [first, second] = blocks as ContentLayoutBlock[]
  if (!first.width || !second.width) return 'Every Content Layout block requires a width.'

  return WIDTH_VALUES[first.width] + WIDTH_VALUES[second.width] === 1 ||
    'Two-block row widths must total full width (e.g., 1/3 + 2/3, 1/2 + 1/2).'
}

export const isFullBleedEligible = (row: ContentLayoutRow): boolean =>
  row.blocks?.length === 1 &&
  row.blocks[0]?._type === 'contentLayoutMedia' &&
  row.blocks[0]?.width === 'full'

export const validateContentLayoutRow = (value: unknown): string | boolean => {
  if (!value || typeof value !== 'object') return true

  const row = value as ContentLayoutRow
  const blocks = row.blocks
  if (!Array.isArray(blocks) || blocks.length < 1 || blocks.length > 3) {
    return 'A Content Layout Row must contain one, two, or three blocks.'
  }
  if (blocks.some((block) => !block.width)) {
    return 'Every Content Layout block requires a width.'
  }

  if (blocks.length === 3) {
    const spacers = blocks.filter((block) => block._type === 'contentLayoutSpacer')
    const totalWidth = blocks.reduce((total, block) => total + (WIDTH_VALUES[block.width!] ?? 0), 0)

    if (spacers.length !== 1 || totalWidth !== 1) {
      return 'Three-block rows require one Spacer Block and widths totaling full width.'
    }
  }

  const widthResult = validateTwoBlockRowWidths(blocks)
  if (widthResult !== true) return widthResult

  return true
}
