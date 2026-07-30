import {describe, expect, it} from 'vitest'
import {
  WORK_MOSAIC_PRESETS,
  assertValidMosaicPreset,
  resolveMosaic,
  type WorkMosaicPreset,
} from './workMosaic'

const presetNames = Object.keys(WORK_MOSAIC_PRESETS)

const rectOf = (preset: WorkMosaicPreset, index: number) => {
  const slot = preset.slots[index]
  const resolved = resolveMosaic(preset)[index]
  return {
    leftCol: slot.column - 1,
    rightCol: slot.column - 1 + slot.span,
    rowStart: resolved.rowStart,
    rowEnd: resolved.rowStart + resolved.rowSpan,
  }
}

describe('workMosaic presets', () => {
  it('ships exactly 3 presets', () => {
    expect(presetNames).toHaveLength(3)
  })

  it.each(presetNames)('%s: slots never overlap', (name) => {
    const preset = WORK_MOSAIC_PRESETS[name as keyof typeof WORK_MOSAIC_PRESETS]
    const rects = preset.slots.map((_, index) => rectOf(preset, index))
    for (let a = 0; a < rects.length; a++) {
      for (let b = a + 1; b < rects.length; b++) {
        const colsOverlap =
          rects[a].leftCol < rects[b].rightCol && rects[b].leftCol < rects[a].rightCol
        const rowsOverlap =
          rects[a].rowStart < rects[b].rowEnd && rects[b].rowStart < rects[a].rowEnd
        expect(colsOverlap && rowsOverlap).toBe(false)
      }
    }
  })

  it.each(presetNames)('%s: outer media touches both screen edges', (name) => {
    const preset = WORK_MOSAIC_PRESETS[name as keyof typeof WORK_MOSAIC_PRESETS]
    expect(preset.slots.some((slot) => slot.column === 1)).toBe(true)
    expect(preset.slots.some((slot) => slot.column + slot.span - 1 === 12)).toBe(true)
  })

  it.each(presetNames)('%s: captions keep a usable lane clear of media', (name) => {
    const preset = WORK_MOSAIC_PRESETS[name as keyof typeof WORK_MOSAIC_PRESETS]
    for (const slot of resolveMosaic(preset)) {
      expect(slot.captionMaxCqw).toBeGreaterThanOrEqual(10)
    }
  })

  it.each(presetNames)('%s: captions never exceed their own slot width', (name) => {
    const preset = WORK_MOSAIC_PRESETS[name as keyof typeof WORK_MOSAIC_PRESETS]
    const resolved = resolveMosaic(preset)
    preset.slots.forEach((slot, index) => {
      expect(resolved[index].captionMaxCqw).toBeLessThanOrEqual((slot.span / 12) * 100)
    })
  })

  it('stagger-right clamps item 3 early so the item 1 description fits', () => {
    const resolved = resolveMosaic(WORK_MOSAIC_PRESETS['stagger-right'])
    // Item 3 is clamped to span 5 anchored on column 4, leaving item 1 a
    // 3-column (25cqw) lane: 24cqw of caption after slack (was 16cqw).
    expect(resolved[2].gridColumn).toBe('4 / span 5')
    expect(resolved[0].captionMaxCqw).toBe(24)
  })

  it('applies known CMS ratio overrides and ignores unknown ones', () => {
    const preset = WORK_MOSAIC_PRESETS['stagger-right']
    const resolved = resolveMosaic(preset, (index) => (index === 1 ? '9:16' : 'intrinsic'))
    expect(resolved[1].ratio).toBe('9:16')
    expect(resolved[0].ratio).toBe('16:9')
  })

  it('keeps stacked slots flush when overrides change media height', () => {
    const preset = WORK_MOSAIC_PRESETS['stagger-right']
    const resolved = resolveMosaic(preset, (index) => (index === 0 ? '1:1' : undefined))
    const item1End = resolved[0].rowStart + resolved[0].rowSpan
    expect(resolved[2].rowStart).toBe(item1End)
  })

  it('rejects a preset that crushes a caption lane', () => {
    const bad: WorkMosaicPreset = {
      slots: [
        {column: 1, span: 8, ratio: '16:9', captionAnchor: 'left'},
        {column: 9, span: 4, ratio: '4:5', captionAnchor: 'left'},
        // Sits directly below slot 1 covering its caption lane.
        {column: 1, span: 6, ratio: '1:1', captionAnchor: 'left', below: 0},
        {column: 7, span: 6, ratio: '16:9', captionAnchor: 'left', below: 2},
      ],
    }
    expect(() => assertValidMosaicPreset('bad', bad)).toThrow(/caption lane/)
  })

  it('rejects overlapping and off-grid presets', () => {
    const overlapping: WorkMosaicPreset = {
      slots: [
        {column: 1, span: 8, ratio: '16:9', captionAnchor: 'left'},
        {column: 8, span: 5, ratio: '4:5', captionAnchor: 'left'},
      ],
    }
    expect(() => assertValidMosaicPreset('overlap', overlapping)).toThrow(/overlap/)
    const offGrid: WorkMosaicPreset = {
      slots: [{column: 10, span: 4, ratio: '16:9', captionAnchor: 'left'}],
    }
    expect(() => assertValidMosaicPreset('off-grid', offGrid)).toThrow(/escapes/)
  })
})
