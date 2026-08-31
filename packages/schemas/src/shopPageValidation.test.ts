/**
 * Document-level validation wiring for the Shop Page singleton, through the
 * real Studio validation engine. The Featured Item is optional, but once
 * present it must be complete: one media block, one text block, and a CTA —
 * with media + text widths totalling full width.
 */
import {describe, expect, it} from 'vitest'
import {errorMarkers, mediaBoxImage, textBlock} from './validationHarness'

const mediaBlock = (width = '1/2') => ({
  _type: 'contentLayoutMedia',
  width,
  aspectRatio: '1:1',
  media: mediaBoxImage(),
})

const textBlock_ = (width = '1/2') => ({
  _type: 'contentLayoutText',
  width,
  text: [textBlock('Featured copy')],
})

function baseShopPage(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'drafts.shopPage',
    _type: 'shopPage',
    ...overrides,
  } as any
}

const completeFeatured = () => ({
  media: mediaBlock(),
  text: textBlock_(),
  ctaLabel: 'Shop the drop',
  ctaHref: '/shop/products/featured-product',
})

describe('shop page document validation', () => {
  it('accepts a shop page with no featured section', async () => {
    expect(await errorMarkers(baseShopPage())).toEqual([])
  })

  it('accepts a complete featured section', async () => {
    expect(await errorMarkers(baseShopPage({featured: completeFeatured()}))).toEqual([])
  })

  it('accepts a relative or absolute CTA destination', async () => {
    expect(
      await errorMarkers(
        baseShopPage({featured: {...completeFeatured(), ctaHref: 'https://example.com/drop'}}),
      ),
    ).toEqual([])
  })

  it('requires every featured field once the section exists', async () => {
    const markers = await errorMarkers(baseShopPage({featured: {ctaLabel: 'Shop the drop'}}))
    expect(markers).toEqual(
      expect.arrayContaining([
        {path: ['featured', 'media'], message: expect.stringContaining('Required')},
        {path: ['featured', 'text'], message: expect.stringContaining('Required')},
        {path: ['featured', 'ctaHref'], message: expect.stringContaining('Required')},
      ]),
    )
  })

  it('requires the media block fields', async () => {
    const markers = await errorMarkers(
      baseShopPage({
        featured: {...completeFeatured(), media: {width: '1/2'}},
      }),
    )
    expect(markers).toEqual(
      expect.arrayContaining([
        {path: ['featured', 'media', 'media'], message: expect.stringContaining('Required')},
        {path: ['featured', 'media', 'aspectRatio'], message: expect.stringContaining('Required')},
      ]),
    )
  })

  it('requires media and text widths to total full width', async () => {
    const markers = await errorMarkers(
      baseShopPage({
        featured: {...completeFeatured(), media: mediaBlock('2/3'), text: textBlock_('1/2')},
      }),
    )
    expect(markers).toEqual([
      {path: ['featured'], message: expect.stringContaining('must total full width')},
    ])
  })

  it('accepts complementary width pairs', async () => {
    expect(
      await errorMarkers(
        baseShopPage({
          featured: {...completeFeatured(), media: mediaBlock('1/3'), text: textBlock_('2/3')},
        }),
      ),
    ).toEqual([])
  })
})
