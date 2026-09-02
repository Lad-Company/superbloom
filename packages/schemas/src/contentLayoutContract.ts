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

// Widths as twelfths of the 12-column grid, so multi-block totals compare
// exactly (1/3 + 1/3 + 1/3 is not exactly 1 in floating point).
// Exported for other split-layout contracts (e.g. the Shop Page Featured
// Item) that hold blocks to the same total-full-width rule.
export const WIDTH_COLUMNS: Record<string, number> = {
  '1/4': 3,
  '1/3': 4,
  '1/2': 6,
  '2/3': 8,
  '3/4': 9,
  full: 12,
}
export const FULL_WIDTH_COLUMNS = 12

export const MAX_ROW_BLOCKS = 4

const isCarouselBlock = (block: ContentLayoutBlock) =>
  block?._type === 'contentLayoutCarousel'

export const validateRowBlockWidths = (blocks: unknown): true | string => {
  if (!Array.isArray(blocks) || blocks.length < 2) return true

  const rowBlocks = blocks as ContentLayoutBlock[]
  // Carousel rows are rejected by validateContentLayoutRow with a clearer
  // message; don't pile on a width error here.
  if (rowBlocks.some(isCarouselBlock)) return true
  if (rowBlocks.some((block) => !block.width)) {
    return 'Every Content Layout block requires a width.'
  }

  const total = rowBlocks.reduce((sum, block) => sum + (WIDTH_COLUMNS[block.width!] ?? 0), 0)
  return total === FULL_WIDTH_COLUMNS ||
    'Multi-block row widths must total full width (e.g., 1/2 + 1/2, 1/3 + 1/3 + 1/3, 1/4 + 1/4 + 1/4 + 1/4).'
}

export const isFullBleedEligible = (row: ContentLayoutRow): boolean =>
  row.blocks?.length === 1 &&
  row.blocks[0]?._type === 'contentLayoutMedia' &&
  row.blocks[0]?.width === 'full'

export const validateContentLayoutRow = (value: unknown): true | string => {
  if (!value || typeof value !== 'object') return true

  const row = value as ContentLayoutRow
  const blocks = row.blocks
  if (!Array.isArray(blocks) || blocks.length < 1 || blocks.length > MAX_ROW_BLOCKS) {
    return 'A Content Layout Row must contain between one and four blocks.'
  }

  // Carousels have no width control: they always take the full row, so a
  // carousel can never share a row with other blocks.
  if (blocks.some(isCarouselBlock)) {
    return blocks.length === 1
      ? true
      : 'A Carousel Block always spans the full row. Remove the other blocks from this row.'
  }

  if (blocks.some((block) => !block.width)) {
    return 'Every Content Layout block requires a width.'
  }

  const widthResult = validateRowBlockWidths(blocks)
  if (widthResult !== true) return widthResult

  return true
}
