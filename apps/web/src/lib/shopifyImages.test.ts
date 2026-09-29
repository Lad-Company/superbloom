import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {shopifyImageRendering} from './shopifyImages'

const URL_WITH_VERSION = 'https://cdn.shopify.com/s/files/1/0123/4567/products/tee.png?v=1727000000'

describe('shopifyImageRendering', () => {
  it('builds a width-param srcset on the shared ladder', () => {
    const rendering = shopifyImageRendering(URL_WITH_VERSION)
    const entries = rendering.srcset.split(', ')
    expect(entries).toHaveLength(8)
    expect(entries[0]).toBe(
      `${URL_WITH_VERSION}&width=192 192w`,
    )
    expect(entries[entries.length - 1]).toBe(
      `${URL_WITH_VERSION}&width=2560 2560w`,
    )
  })

  it('preserves existing query params (the CDN version token)', () => {
    const rendering = shopifyImageRendering(URL_WITH_VERSION, {widths: [640]})
    expect(rendering.src).toContain('v=1727000000')
    expect(rendering.src).toContain('width=640')
  })

  it('drops rungs above the native width (the CDN never upscales)', () => {
    const rendering = shopifyImageRendering(URL_WITH_VERSION, {nativeWidth: 1337})
    expect(rendering.srcset).toContain('1280w')
    expect(rendering.srcset).not.toContain('1600w')
    expect(rendering.srcset.split(', ')).toHaveLength(5)
  })

  it('keeps at least the smallest rung for a source narrower than the ladder', () => {
    const rendering = shopifyImageRendering(URL_WITH_VERSION, {nativeWidth: 100})
    expect(rendering.srcset).toBe(`${URL_WITH_VERSION}&width=192 192w`)
  })

  it('honors an explicit rung subset (cart thumbnails)', () => {
    const rendering = shopifyImageRendering(URL_WITH_VERSION, {widths: [192, 320]})
    expect(rendering.srcset).toBe(
      `${URL_WITH_VERSION}&width=192 192w, ${URL_WITH_VERSION}&width=320 320w`,
    )
  })

  it('picks a mid-ladder rung as the no-srcset fallback src', () => {
    expect(shopifyImageRendering(URL_WITH_VERSION).src).toBe(`${URL_WITH_VERSION}&width=1280`)
    expect(shopifyImageRendering(URL_WITH_VERSION, {widths: [192, 320]}).src).toBe(
      `${URL_WITH_VERSION}&width=320`,
    )
  })
})

describe('shop consumers ride the ladder', () => {
  it('ProductGrid renders srcset/sizes/width/height on SSR cards and the Load More path', () => {
    const source = readFileSync(
      new URL('../components/shop/ProductGrid.astro', import.meta.url),
      'utf8',
    )
    expect(source).toContain('shopifyImageRendering')
    expect(source).toContain('CARD_SIZES')
    expect(source).toContain('srcset={image.srcset}')
    expect(source).toContain('sizes={CARD_SIZES}')
    // The load-more template path builds the same rendering client-side.
    expect(source).toContain('image.srcset = rendering.srcset')
    // No raw full-size URL may reach an <img> anymore.
    expect(source).not.toContain('src={product.featuredImage.url}')
    expect(source).not.toContain('image.src = product.featuredImage.url')
  })

  it('the product detail page renders srcset/sizes/width/height', () => {
    const source = readFileSync(
      new URL('../pages/shop/products/[handle].astro', import.meta.url),
      'utf8',
    )
    expect(source).toContain('shopifyImageRendering')
    expect(source).toContain('srcset={detailImage.srcset}')
    expect(source).toContain('sizes={DETAIL_SIZES}')
    expect(source).not.toContain('src={product.featuredImage.url}')
  })

  it('shop pages preconnect to cdn.shopify.com via the Layout prop', () => {
    const layout = readFileSync(new URL('../layouts/Layout.astro', import.meta.url), 'utf8')
    expect(layout).toContain('preconnects?: string[]')
    const grid = readFileSync(new URL('../pages/shop/index.astro', import.meta.url), 'utf8')
    expect(grid).toContain("preconnects={['https://cdn.shopify.com']}")
    const detail = readFileSync(
      new URL('../pages/shop/products/[handle].astro', import.meta.url),
      'utf8',
    )
    expect(detail).toContain("preconnects={['https://cdn.shopify.com']}")
  })

  it('the cart drawer renders small-rung thumbnails, not full-size URLs', () => {
    const source = readFileSync(
      new URL('../components/cart/CartDrawer.astro', import.meta.url),
      'utf8',
    )
    expect(source).toContain('shopifyImageRendering')
    expect(source).not.toContain('img.src = image.url')
  })
})
