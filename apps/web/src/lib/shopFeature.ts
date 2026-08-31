import type {TypedObject} from 'astro-portabletext/types'
import type {Media, MediaRatio} from '../components/MediaFrame.astro'
import type {ContentLayoutWidth} from './contentLayout'

// Featured shop item: the same media/copy split structure as the zine
// Letter from the Editor, but the column widths are CMS-defined with the
// case-study Content Layout widths (media + text must total full width).
export interface ShopFeatureValue {
  ctaLabel?: string | null
  ctaHref?: string | null
  media?: {
    width?: ContentLayoutWidth | null
    aspectRatio?: MediaRatio | null
    media?: Media | null
  } | null
  text?: {
    width?: ContentLayoutWidth | null
    text?: TypedObject[] | null
  } | null
}

/** Sanity blocks publishing a partial Featured Item (all four parts are
   required once the section exists), so a published shop page either has a
   complete feature or none. Anything incomplete is legacy/draft data and
   must not render — nor suppress the Shop header. */
export const isShopFeatureComplete = (featured: ShopFeatureValue | null | undefined): boolean =>
  Boolean(
    featured?.media?.media &&
      featured?.text?.text?.length &&
      featured?.ctaLabel &&
      featured?.ctaHref,
  )
