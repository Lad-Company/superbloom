import {urlFor, type ImageSource} from './imageCropping';

export const seoDescription = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return undefined;

  const text = value
    .flatMap((block) =>
      typeof block === 'object' && block && 'children' in block && Array.isArray(block.children)
        ? block.children
        : [],
    )
    .flatMap((child) =>
      typeof child === 'object' && child && 'text' in child && typeof child.text === 'string'
        ? [child.text]
        : [],
    )
    .join(' ')
    .trim();

  return text || undefined;
};

/**
 * Build a focal-point-aware OG-sized URL (1200x630, the canonical social card
 * aspect ratio). Editors' hotspotted pins survive the crop because
 * `urlFor({asset, crop, hotspot})` routes through Sanity's CDN, which emits
 * `fp-x` / `fp-y` params when a hotspot is present.
 */
export const buildSeoImageUrl = (
  source: ImageSource,
  width: number,
  height: number,
): string =>
  urlFor(source)
    .width(width)
    .height(height)
    .fit('crop')
    .auto('format')
    .url();

export const seoImage = (media: unknown): string | undefined => {
  if (!media || typeof media !== 'object' || !('asset' in media)) return undefined;
  const image = (media as {asset?: unknown}).asset;
  if (!image || typeof image !== 'object') return undefined;
  const projection = image as {
    _type?: string
    asset?: {_ref?: string | null} | null
    crop?: ImageSource['crop']
    hotspot?: ImageSource['hotspot']
  };
  if (projection._type !== 'image' || !projection.asset?._ref) return undefined;
  try {
    return buildSeoImageUrl(
      {
        asset: projection.asset,
        crop: projection.crop ?? undefined,
        hotspot: projection.hotspot ?? undefined,
      },
      1200,
      630,
    );
  } catch {
    return undefined;
  }
};
