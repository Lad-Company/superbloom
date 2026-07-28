import {describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => {
  const builder = {
    image: vi.fn(),
  }
  return {builder}
})

vi.mock('@sanity/image-url', () => ({
  default: () => mocks.builder,
}))

vi.mock('./sanity', () => ({sanityClient: {}}))

import {
  buildImageRendering,
  IMAGE_LADDER,
  type ImageSource,
  isSvgImage,
  urlFor,
} from './imageCropping'

const mockChain = (finalUrl: string) => {
  const chain = {
    width: vi.fn().mockReturnThis(),
    height: vi.fn().mockReturnThis(),
    fit: vi.fn().mockReturnThis(),
    auto: vi.fn().mockReturnThis(),
    url: vi.fn().mockReturnValue(finalUrl),
  }
  return chain
}

describe('imageCropping helpers', () => {
  it('exposes the canonical Sanity CDN ladder', () => {
    expect(IMAGE_LADDER).toEqual([320, 640, 960, 1280, 1600, 1920, 2560])
  })

  it('classifies SVG images by mime type', () => {
    expect(isSvgImage('image/svg+xml')).toBe(true)
    expect(isSvgImage('image/png')).toBe(false)
    expect(isSvgImage(null)).toBe(false)
  })
})

describe('buildImageRendering', () => {
  it('returns the original asset URL untouched for SVG sources', () => {
    const chain = mockChain('https://cdn.example.com/raw.svg')
    mocks.builder.image.mockReturnValue(chain)

    const source: ImageSource = {asset: {_ref: 'image-abc-123', _type: 'sanity.imageAsset'}}
    const result = buildImageRendering({
      source,
      mimeType: 'image/svg+xml',
      nativeWidth: 800,
      nativeHeight: 600,
      ratio: '16:9',
    })

    expect(result.src).toBe('https://cdn.example.com/raw.svg')
    expect(result.srcset).toBeUndefined()
    expect(result.width).toBe(800)
    expect(result.height).toBe(600)
    expect(chain.fit).not.toHaveBeenCalled()
    expect(chain.auto).not.toHaveBeenCalled()
  })

  it('width-only resizing for fill ratio (no forced crop)', () => {
    const chain = mockChain('https://cdn.example.com/w.png')
    mocks.builder.image.mockReturnValue(chain)

    const source: ImageSource = {asset: {_ref: 'image-abc-123', _type: 'sanity.imageAsset'}}
    const result = buildImageRendering({
      source,
      mimeType: 'image/png',
      nativeWidth: 2000,
      nativeHeight: 1200,
      ratio: 'fill',
    })

    expect(chain.width).toHaveBeenCalledWith(1920)
    expect(chain.height).not.toHaveBeenCalled()
    expect(chain.fit).not.toHaveBeenCalled()
    expect(result.srcset).toContain('320w')
    expect(result.srcset).toContain('1920w')
    expect(result.srcset).not.toContain('2560w')
  })

  it('clamps srcset to widths at or below the native image width', () => {
    const chain = mockChain('https://cdn.example.com/w.png')
    mocks.builder.image.mockReturnValue(chain)

    const source: ImageSource = {asset: {_ref: 'image-abc-123', _type: 'sanity.imageAsset'}}
    const result = buildImageRendering({
      source,
      mimeType: 'image/jpeg',
      nativeWidth: 640,
      nativeHeight: 480,
      ratio: '3:2',
    })

    expect(result.srcset).toContain('320w')
    expect(result.srcset).toContain('640w')
    expect(result.srcset).not.toContain('960w')
    expect(result.srcset).not.toContain('1280w')
  })

  it('requests fixed-aspect crop URLs for every ladder rung', () => {
    const chain = mockChain('https://cdn.example.com/w.png')
    mocks.builder.image.mockReturnValue(chain)

    const source: ImageSource = {
      asset: {_ref: 'image-abc-123', _type: 'sanity.imageAsset'},
      hotspot: {x: 0.5, y: 0.5, width: 0.4, height: 0.4},
    }
    const result = buildImageRendering({
      source,
      mimeType: 'image/jpeg',
      nativeWidth: 1920,
      nativeHeight: 1280,
      ratio: '16:9',
    })

    expect(chain.fit).toHaveBeenCalledWith('crop')
    expect(chain.auto).toHaveBeenCalledWith('format')
    // Height for each ladder width is width * 9/16: 320→180, 640→360, … 1920→1080.
    expect(chain.height).toHaveBeenCalledWith(1080)
    // srcset should include both 320w and 1920w entries at the requested aspect
    expect(result.srcset).toMatch(/https:\/\/cdn\.example\.com\/w\.png 320w/)
    expect(result.srcset).toMatch(/https:\/\/cdn\.example\.com\/w\.png 1920w/)
    expect(result.src).toMatch(/^https:\/\/cdn\.example\.com\/w\.png$/)
  })

  it('still emits a src attribute when no clampable ladder rungs exist', () => {
    const chain = mockChain('https://cdn.example.com/w.png')
    mocks.builder.image.mockReturnValue(chain)

    const source: ImageSource = {asset: {_ref: 'image-abc-123', _type: 'sanity.imageAsset'}}
    const result = buildImageRendering({
      source,
      mimeType: 'image/jpeg',
      nativeWidth: 100,
      nativeHeight: 80,
      ratio: '1:1',
    })

    expect(result.srcset).toBeUndefined()
    expect(result.src).toBe('https://cdn.example.com/w.png')
  })
})

describe('urlFor', () => {
  it('returns a builder that can chain crop transforms', () => {
    const chain = mockChain('https://cdn.example.com/x.png')
    mocks.builder.image.mockReturnValue(chain)

    const source: ImageSource = {asset: {_ref: 'image-abc', _type: 'sanity.imageAsset'}}
    const result = urlFor(source).width(320).fit('crop').url()

    expect(result).toBe('https://cdn.example.com/x.png')
  })
})
