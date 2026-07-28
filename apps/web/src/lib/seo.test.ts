import {describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({builder: {image: vi.fn()}}))

vi.mock('@sanity/image-url', () => ({default: () => mocks.builder}))
vi.mock('./sanity', () => ({sanityClient: {}}))

import {seoImage} from './seo'

describe('seoImage', () => {
  it('returns undefined for null/undefined input', () => {
    expect(seoImage(null)).toBeUndefined()
    expect(seoImage(undefined)).toBeUndefined()
  })

  it('returns undefined for non-image assets', () => {
    expect(
      seoImage({asset: {_type: 'mux.video', playbackId: 'abc'}}),
    ).toBeUndefined()
  })

  it('returns undefined when the image asset has no reference', () => {
    expect(seoImage({asset: {_type: 'image', asset: null}})).toBeUndefined()
  })

  it('builds a focal-point-aware 1200x630 crop URL when an image asset is present', () => {
    const chain = {
      width: vi.fn().mockReturnThis(),
      height: vi.fn().mockReturnThis(),
      fit: vi.fn().mockReturnThis(),
      auto: vi.fn().mockReturnThis(),
      url: vi.fn().mockReturnValue('https://cdn.example.com/og.jpg'),
    }
    mocks.builder.image.mockReturnValue(chain)

    const result = seoImage({
      asset: {
        _type: 'image',
        asset: {_ref: 'image-abc-123'},
        hotspot: {x: 0.4, y: 0.6, width: 0.3, height: 0.3},
        crop: {top: 0.05, bottom: 0.05, left: 0, right: 0},
      },
    })

    expect(result).toBe('https://cdn.example.com/og.jpg')
    expect(chain.width).toHaveBeenCalledWith(1200)
    expect(chain.height).toHaveBeenCalledWith(630)
    expect(chain.fit).toHaveBeenCalledWith('crop')
  })
})
