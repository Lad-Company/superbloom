/**
 * HomeWork mosaic presets.
 *
 * The homepage work mosaic is a fixed 4-slot interlocking grid (12 columns,
 * 1cqw rows), modelled on the canonical weareinertia.com home-projects layout:
 *
 *   1. Inner items touch: adjacent media edges interlock exactly, no gutters.
 *   2. Outer media touches the screen edges (the section drops page gutters).
 *   3. Floating captions never touch neighbouring media: each caption's max
 *      width is derived from the clear lane below its own media, capped at its
 *      slot width, minus a fixed slack.
 *
 * Presets only apply on desktop (>= 1024px); mobile stacks full-width cards.
 * Every preset is validated at module load, so a broken preset fails the build
 * instead of shipping a broken mosaic.
 */

export type WorkMosaicRatio = '2:1' | '16:9' | '3:2' | '1:1' | '4:5' | '9:16'

export interface WorkMosaicSlot {
  /** 1-based start column on the 12-column grid. */
  column: number
  /** Number of grid columns the media spans. */
  span: number
  /** Default media ratio; a known CMS per-item ratio override wins. */
  ratio: WorkMosaicRatio
  /** Side of the slot the floating caption hugs. */
  captionAnchor: 'left' | 'right'
  /** Index of the slot this one stacks flush beneath. Omit for the top row. */
  below?: number
}

export interface WorkMosaicPreset {
  slots: readonly WorkMosaicSlot[]
}

export const WORK_MOSAIC_PRESETS = {
  // Wide lead top-left, tall top-right, square clamped flush against the tall
  // item (leaving the lead caption a clear 3-column lane), wide tail
  // bottom-right.
  'stagger-right': {
    slots: [
      {column: 1, span: 8, ratio: '16:9', captionAnchor: 'left'},
      {column: 9, span: 4, ratio: '4:5', captionAnchor: 'left'},
      {column: 4, span: 5, ratio: '1:1', captionAnchor: 'left', below: 0},
      {column: 7, span: 6, ratio: '16:9', captionAnchor: 'left', below: 2},
    ],
  },
  // Horizontal mirror of stagger-right.
  'stagger-left': {
    slots: [
      {column: 5, span: 8, ratio: '16:9', captionAnchor: 'right'},
      {column: 1, span: 4, ratio: '4:5', captionAnchor: 'left'},
      {column: 5, span: 5, ratio: '1:1', captionAnchor: 'right', below: 0},
      {column: 1, span: 6, ratio: '16:9', captionAnchor: 'left', below: 2},
    ],
  },
  // Wide 3:2 lead top-left, square top-right, portrait clamped beneath the
  // lead against the square's lane, wide tail bottom-right.
  'split-stagger': {
    slots: [
      {column: 1, span: 8, ratio: '3:2', captionAnchor: 'left'},
      {column: 9, span: 4, ratio: '1:1', captionAnchor: 'right'},
      {column: 5, span: 4, ratio: '4:5', captionAnchor: 'left', below: 0},
      {column: 7, span: 6, ratio: '16:9', captionAnchor: 'left', below: 2},
    ],
  },
} as const satisfies Record<string, WorkMosaicPreset>

export type WorkMosaicPresetName = keyof typeof WORK_MOSAIC_PRESETS

const COLUMNS = 12
/** Rows below a media cell that its caption may occupy when measuring lanes. */
const CAPTION_BAND_ROWS = 12
/** Gap kept between a caption lane and neighbouring media, in cqw. */
const CAPTION_SLACK_CQW = 1
/** Minimum usable caption width; anything less fails preset validation. */
const MIN_CAPTION_CQW = 10

// Height / width for each supported ratio, used to derive a slot's row span on
// the proportional (1cqw) row grid so media edges interlock exactly.
const RATIO_HW: Record<WorkMosaicRatio, number> = {
  '2:1': 1 / 2,
  '16:9': 9 / 16,
  '3:2': 2 / 3,
  '1:1': 1,
  '4:5': 5 / 4,
  '9:16': 16 / 9,
}

export interface ResolvedMosaicSlot {
  /** Effective ratio after applying the per-item CMS override. */
  ratio: WorkMosaicRatio
  /** '1 / span 8' style grid-column value. */
  gridColumn: string
  rowStart: number
  rowSpan: number
  captionAnchor: 'left' | 'right'
  /** Max caption width (cqw) before it would touch neighbouring media. */
  captionMaxCqw: number
  /** Media width as a percentage of the container, for image `sizes`. */
  widthVw: number
}

interface SlotRect {
  index: number
  leftCol: number
  rightCol: number
  rowStart: number
  /** Exclusive grid line below the media. */
  rowEnd: number
}

const round1 = (value: number) => Math.round(value * 10) / 10
const colToCqw = (col: number) => (col / COLUMNS) * 100

function buildRects(preset: WorkMosaicPreset, ratioAt: (index: number) => WorkMosaicRatio) {
  const rowSpanAt = (index: number): number =>
    Math.max(
      1,
      Math.round(colToCqw(preset.slots[index].span) * RATIO_HW[ratioAt(index)]),
    )
  const rowStartAt = (index: number): number => {
    const below = preset.slots[index].below
    return below === undefined ? 1 : rowStartAt(below) + rowSpanAt(below)
  }
  return preset.slots.map((slot, index): SlotRect => {
    const rowStart = rowStartAt(index)
    return {
      index,
      leftCol: slot.column - 1,
      rightCol: slot.column - 1 + slot.span,
      rowStart,
      rowEnd: rowStart + rowSpanAt(index),
    }
  })
}

/** Clear caption lane width in columns for one rect, capped at its own span. */
function captionClearCols(rect: SlotRect, rects: SlotRect[], anchor: 'left' | 'right'): number {
  const bandStart = rect.rowEnd
  const bandEnd = rect.rowEnd + CAPTION_BAND_ROWS
  const lane = rects.filter(
    (other) =>
      other.index !== rect.index && other.rowStart < bandEnd && other.rowEnd > bandStart,
  )
  let clear: number
  if (anchor === 'left') {
    // First obstruction extending rightward from the anchor edge.
    const obstructions = lane
      .filter((other) => other.rightCol > rect.leftCol)
      .map((other) => other.leftCol - rect.leftCol)
    clear = obstructions.length > 0 ? Math.min(...obstructions) : COLUMNS - rect.leftCol
  } else {
    // First obstruction extending leftward from the anchor edge.
    const obstructions = lane
      .filter((other) => other.leftCol < rect.rightCol)
      .map((other) => rect.rightCol - other.rightCol)
    clear = obstructions.length > 0 ? Math.min(...obstructions) : rect.rightCol
  }
  return Math.min(clear, rect.rightCol - rect.leftCol)
}

export function resolveMosaic(
  preset: WorkMosaicPreset,
  ratioOverride?: (index: number) => string | null | undefined,
): ResolvedMosaicSlot[] {
  const ratioAt = (index: number): WorkMosaicRatio => {
    const override = ratioOverride?.(index)
    return override && override in RATIO_HW
      ? (override as WorkMosaicRatio)
      : preset.slots[index].ratio
  }
  const rects = buildRects(preset, ratioAt)
  return rects.map((rect) => {
    const slot = preset.slots[rect.index]
    const clearCqw = colToCqw(captionClearCols(rect, rects, slot.captionAnchor))
    return {
      ratio: ratioAt(rect.index),
      gridColumn: `${slot.column} / span ${slot.span}`,
      rowStart: rect.rowStart,
      rowSpan: rect.rowEnd - rect.rowStart,
      captionAnchor: slot.captionAnchor,
      captionMaxCqw: round1(Math.max(0, clearCqw - CAPTION_SLACK_CQW)),
      widthVw: Math.round(colToCqw(slot.span)),
    }
  })
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart < bEnd && bStart < aEnd

export function assertValidMosaicPreset(name: string, preset: WorkMosaicPreset): void {
  const fail = (reason: string): never => {
    throw new Error(`workMosaic preset "${name}": ${reason}`)
  }
  preset.slots.forEach((slot, index) => {
    if (slot.span < 1 || slot.column < 1 || slot.column + slot.span - 1 > COLUMNS) {
      fail(`slot ${index} column ${slot.column} / span ${slot.span} escapes the 12-column grid`)
    }
    if (slot.below !== undefined && (slot.below < 0 || slot.below >= index)) {
      fail(`slot ${index} below must reference an earlier slot`)
    }
  })

  const rects = buildRects(preset, (index) => preset.slots[index].ratio)

  for (let a = 0; a < rects.length; a++) {
    for (let b = a + 1; b < rects.length; b++) {
      if (
        overlaps(rects[a].leftCol, rects[a].rightCol, rects[b].leftCol, rects[b].rightCol) &&
        overlaps(rects[a].rowStart, rects[a].rowEnd, rects[b].rowStart, rects[b].rowEnd)
      ) {
        fail(`slots ${a} and ${b} overlap`)
      }
    }
  }

  // Rule 2: outer media touches both screen edges.
  if (!rects.some((rect) => rect.leftCol === 0)) fail('no slot touches the left screen edge')
  if (!rects.some((rect) => rect.rightCol === COLUMNS)) {
    fail('no slot touches the right screen edge')
  }

  // Rule 1: every slot touches a screen edge or shares a flush edge with a
  // neighbouring media cell.
  rects.forEach((rect, index) => {
    const touching = rects.some((other) => {
      if (other.index === index) return false
      const rowsTouch = overlaps(rect.rowStart, rect.rowEnd, other.rowStart, other.rowEnd)
      const colsTouch = overlaps(rect.leftCol, rect.rightCol, other.leftCol, other.rightCol)
      return (
        (rowsTouch && (other.rightCol === rect.leftCol || other.leftCol === rect.rightCol)) ||
        (colsTouch && (other.rowEnd === rect.rowStart || other.rowStart === rect.rowEnd))
      )
    })
    if (!touching && rect.leftCol !== 0 && rect.rightCol !== COLUMNS) {
      fail(`slot ${index} floats free of both screen edges and neighbouring media`)
    }
  })

  // Rule 3: every caption keeps a usable lane clear of neighbouring media.
  rects.forEach((rect, index) => {
    const anchor = preset.slots[index].captionAnchor
    const clearCqw = colToCqw(captionClearCols(rect, rects, anchor)) - CAPTION_SLACK_CQW
    if (clearCqw < MIN_CAPTION_CQW) {
      fail(`slot ${index} caption lane is ${round1(clearCqw)}cqw (< ${MIN_CAPTION_CQW}cqw)`)
    }
  })
}

for (const [name, preset] of Object.entries(WORK_MOSAIC_PRESETS)) {
  assertValidMosaicPreset(name, preset)
}
