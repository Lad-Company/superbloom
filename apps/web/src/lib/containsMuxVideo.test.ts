import {describe, expect, it} from 'vitest'
import {containsMuxVideo} from './containsMuxVideo'

describe('containsMuxVideo', () => {
  it('finds a mux.video asset with a playbackId anywhere in the tree', () => {
    const page = {
      hero: {heading: 'Hi', heroMedia: {asset: {_type: 'mux.video', playbackId: 'abc123'}}},
      blocks: [{items: [{media: null}]}],
    }
    expect(containsMuxVideo(page)).toBe(true)
  })

  it('ignores mux.video entries without a playbackId (unusable asset)', () => {
    expect(containsMuxVideo({asset: {_type: 'mux.video', playbackId: null}})).toBe(false)
    expect(containsMuxVideo({asset: {_type: 'mux.video'}})).toBe(false)
  })

  it('returns false for image-only and empty payloads', () => {
    expect(
      containsMuxVideo({
        media: {asset: {_type: 'image', asset: {_ref: 'image-abc-123'}}},
        list: [null, undefined, 'mux.video', 42],
      }),
    ).toBe(false)
    expect(containsMuxVideo(null)).toBe(false)
    expect(containsMuxVideo(undefined)).toBe(false)
    expect(containsMuxVideo([])).toBe(false)
  })

  it('finds video nested inside arrays', () => {
    const items = [
      {item: {cardMedia: {asset: {_type: 'image'}}}},
      {item: {cardMedia: {asset: {_type: 'mux.video', playbackId: 'xyz'}}}},
    ]
    expect(containsMuxVideo(items)).toBe(true)
  })

  it('survives circular references via the depth guard', () => {
    const cycle: Record<string, unknown> = {}
    cycle.self = cycle
    expect(containsMuxVideo(cycle)).toBe(false)
  })
})
