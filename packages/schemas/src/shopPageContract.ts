// Pure validators for the Shop Page singleton's optional Featured Item.
import {WIDTH_COLUMNS, FULL_WIDTH_COLUMNS} from './contentLayoutContract'

type FeaturedBlock = {width?: string}
type ShopFeatured = {
  media?: FeaturedBlock
  text?: FeaturedBlock
}

/** The Featured Item is a two-block split (media + text), so the pair of
   widths must fill the 12-column grid exactly — same contract as a
   two-block Content Layout Row. Missing widths are flagged by the blocks'
   own required() rules; don't pile on here. */
export const validateShopFeaturedWidths = (featured: unknown): true | string => {
  if (!featured || typeof featured !== 'object') return true
  const {media, text} = featured as ShopFeatured
  if (!media?.width || !text?.width) return true

  const total = (WIDTH_COLUMNS[media.width] ?? 0) + (WIDTH_COLUMNS[text.width] ?? 0)
  return (
    total === FULL_WIDTH_COLUMNS ||
    'Media and Text widths must total full width (e.g., 1/2 + 1/2, 2/3 + 1/3).'
  )
}
