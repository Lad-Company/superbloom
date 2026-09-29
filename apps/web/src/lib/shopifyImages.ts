import {IMAGE_LADDER} from './imageLadder'

/**
 * Shopify CDN (`cdn.shopify.com`) rendering on the shared width ladder.
 * Storefront `image.url` values accept a `width` query param (the CDN never
 * upscales — a rung above the native width returns the original), so a
 * srcset is string-building, not an API transform. The CDN already
 * content-negotiates WebP/AVIF via the Accept header, so format is left
 * alone.
 *
 * Pure module by design: imported by server code (ProductGrid SSR, product
 * detail) and client code (the Load More template path, the cart drawer)
 * alike, so nothing env-touching from shopify.ts belongs here.
 */
export interface ShopifyImageRendering {
  /** Mid-ladder fallback for the no-srcset case. */
  src: string
  srcset: string
}

const withWidth = (url: string, width: number): string => {
  const parsed = new URL(url)
  parsed.searchParams.set('width', String(width))
  return parsed.toString()
}

export const shopifyImageRendering = (
  url: string,
  options?: {widths?: readonly number[]; nativeWidth?: number | null},
): ShopifyImageRendering => {
  const ladder = options?.widths ?? IMAGE_LADDER
  const nativeWidth = options?.nativeWidth
  const filtered = nativeWidth ? ladder.filter((width) => width <= nativeWidth) : [...ladder]
  // A source narrower than every rung still gets the smallest one — the CDN
  // caps at the native size, so the URL is honest and the srcset non-empty.
  const widths = filtered.length > 0 ? filtered : [ladder[0]]
  return {
    src: withWidth(url, widths[Math.floor(widths.length / 2)]),
    srcset: widths.map((width) => `${withWidth(url, width)} ${width}w`).join(', '),
  }
}
