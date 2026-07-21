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

export const seoImage = (media: unknown): string | undefined => {
  if (!media || typeof media !== 'object' || !('asset' in media)) return undefined;
  const asset = media.asset;
  if (!asset || typeof asset !== 'object' || !('url' in asset)) return undefined;
  return typeof asset.url === 'string' ? asset.url : undefined;
};
