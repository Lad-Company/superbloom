import {BREAKPOINTS} from './breakpoints'
import type {ContentCardSettings, CardWidth} from './contentCard'
import type {ContentLayoutWidth} from './contentLayout'
import {IMAGE_LADDER} from './imageCropping'

/**
 * Placement — where a Media Asset sits in a page composition (CONTEXT.md).
 * Stating the Placement is the caller's whole job; every byte-cost decision
 * (`sizes`, srcset, poster width, load priority) is derived here, from the
 * canonical breakpoints, so no component hand-writes a media-query string.
 *
 * - `hero` — full-viewport band, optionally capped (`fraction` of the
 *   viewport it occupies below the cap, default 1).
 * - `card` — a Content Card's Media Frame; grid lists derive from the card
 *   settings, rails (`rail: true`) from the literal viewport-fraction table
 *   in `styles/contentCardRail.css`.
 * - `layoutBlock` — a Content Layout Row media block on the 12-col grid;
 *   full-width blocks may cap at a content-frame width (`capPx`) instead of
 *   growing with the viewport. Lazy by default, unlike `hero`.
 * - `split` — a block sharing a row at desktop (`vw` of the viewport,
 *   default 50), full width below its collapse breakpoint.
 * - `fixed` — fixed pixel rendering (small / large viewports).
 */
export type MediaPlacement =
  | {context: 'hero'; capPx?: number; fraction?: number}
  | {context: 'card'; settings: ContentCardSettings; rail?: boolean}
  | {context: 'layoutBlock'; width?: ContentLayoutWidth | null; fullBleed?: boolean; capPx?: number}
  | {context: 'split'; collapseAt?: 'desktop' | 'small'; vw?: number}
  | {context: 'fixed'; px: {small: number; large: number}}

export interface MediaRenderingPlan {
  sizes: string
  /** Resolved load priority: the placement's default unless overridden. */
  priority: boolean
  loading: 'eager' | 'lazy'
  fetchpriority: 'high' | 'auto'
  /** `<mux-player preload>` value paired with the priority. */
  preload: 'auto' | 'none'
}

const CARD_WIDTH_FRACTIONS: Record<CardWidth, number> = {
  '1/4': 1 / 4,
  '1/3': 1 / 3,
  '1/2': 1 / 2,
  '2/3': 2 / 3,
  '3/4': 3 / 4,
  full: 1,
}

/** Literal rail widths — must mirror `styles/contentCardRail.css`. */
const RAIL_WIDTH_VW: Record<CardWidth, string> = {
  '1/4': '25vw',
  '1/3': '33.33vw',
  '1/2': '50vw',
  '2/3': '66.67vw',
  '3/4': '75vw',
  full: '100vw',
}

const RAIL_TIGHT_WIDTH = 'min(76vw, 280px)'
const RAIL_NARROW_WIDTH = 'min(56vw, 360px)'

const LAYOUT_WIDTH_COLUMNS: Record<ContentLayoutWidth, number> = {
  '1/4': 3,
  '1/3': 4,
  '1/2': 6,
  '2/3': 8,
  '3/4': 9,
  full: 12,
}

const belowDesktop = (value: string): string =>
  `(max-width: ${BREAKPOINTS.belowDesktopMax}px) 100vw, ${value}`

const heroSizes = (capPx?: number, fraction = 1): string => {
  const vw = Math.round(fraction * 100)
  if (!capPx) return `${vw}vw`
  // The boundary is where `fraction` of the viewport reaches the cap; `.98`
  // keeps the desktop-first no-overlap convention from ADR-0024.
  const boundary = Math.round(capPx / fraction) - 0.02
  return `(max-width: ${boundary}px) ${vw}vw, ${capPx}px`
}

const cardPictureFraction = (settings: ContentCardSettings): number => {
  const cardFraction = CARD_WIDTH_FRACTIONS[settings.cardWidth]
  const infoSharesRow = settings.infoPosition === 'left' || settings.infoPosition === 'right'
  return infoSharesRow ? cardFraction / 2 : cardFraction
}

const cardSizes = (settings: ContentCardSettings, rail: boolean): string => {
  if (rail) {
    // Rails collapse every card to one narrow width in two steps
    // (contentCardRail.css); Info is always below, so the picture spans the
    // card at every range.
    return `(max-width: ${BREAKPOINTS.railTightMax}px) ${RAIL_TIGHT_WIDTH}, (max-width: ${BREAKPOINTS.railNarrowMax}px) ${RAIL_NARROW_WIDTH}, ${RAIL_WIDTH_VW[settings.cardWidth]}`
  }
  const viewportPercentage = Math.max(1, Math.round(cardPictureFraction(settings) * 100))
  return belowDesktop(`${viewportPercentage}vw`)
}

const layoutBlockSizes = (
  width?: ContentLayoutWidth | null,
  fullBleed?: boolean,
  capPx?: number,
): string => {
  if (fullBleed) return '100vw'
  if (!width || width === 'full') return capPx ? heroSizes(capPx) : '100vw'
  const fraction = Math.round((LAYOUT_WIDTH_COLUMNS[width] / 12) * 100)
  return belowDesktop(`${fraction}vw`)
}

const splitSizes = (collapseAt: 'desktop' | 'small', vw: number): string => {
  const boundary = collapseAt === 'small' ? BREAKPOINTS.smallMax : BREAKPOINTS.belowDesktopMax
  return `(max-width: ${boundary}px) 100vw, ${vw}vw`
}

const sizesFor = (placement: MediaPlacement): string => {
  switch (placement.context) {
    case 'hero':
      return heroSizes(placement.capPx, placement.fraction)
    case 'card':
      return cardSizes(placement.settings, placement.rail ?? false)
    case 'layoutBlock':
      return layoutBlockSizes(placement.width, placement.fullBleed ?? false, placement.capPx)
    case 'split':
      return splitSizes(placement.collapseAt ?? 'desktop', placement.vw ?? 50)
    case 'fixed':
      return `(max-width: ${BREAKPOINTS.smallMax}px) ${placement.px.small}px, ${placement.px.large}px`
  }
}

export const planMediaRendering = (
  placement: MediaPlacement,
  options?: {priority?: boolean},
): MediaRenderingPlan => {
  const priority = options?.priority ?? placement.context === 'hero'
  return {
    sizes: sizesFor(placement),
    priority,
    loading: priority ? 'eager' : 'lazy',
    fetchpriority: priority ? 'high' : 'auto',
    preload: priority ? 'auto' : 'none',
  }
}

export interface MuxPosterRendering {
  /** Placement-rung URL — the `<mux-player poster>` attribute (which takes
   *  exactly one URL) and the poster `<img src>` fallback under the srcset. */
  src: string
  srcset: string
}

const muxPosterUrl = (playbackId: string, width: number): string =>
  `https://image.mux.com/${playbackId}/thumbnail.webp?width=${width}&time=0`

/** The single-URL poster can't adapt per viewport, so estimate the rendered
 *  width once: viewport-fraction placements at a nominal desktop viewport,
 *  capped bands at their cap, and fixed frames at 2x their declared pixels
 *  (small enough that DPR sharpness is cheap). */
const NOMINAL_VIEWPORT_PX = 1440

const posterTargetPx = (placement: MediaPlacement): number => {
  switch (placement.context) {
    case 'hero':
      return placement.capPx ?? NOMINAL_VIEWPORT_PX * (placement.fraction ?? 1)
    case 'card':
      if (placement.rail) {
        return (parseFloat(RAIL_WIDTH_VW[placement.settings.cardWidth]) / 100) * NOMINAL_VIEWPORT_PX
      }
      return cardPictureFraction(placement.settings) * NOMINAL_VIEWPORT_PX
    case 'layoutBlock': {
      if (placement.fullBleed) return NOMINAL_VIEWPORT_PX
      if (!placement.width || placement.width === 'full') {
        return placement.capPx ?? NOMINAL_VIEWPORT_PX
      }
      return (LAYOUT_WIDTH_COLUMNS[placement.width] / 12) * NOMINAL_VIEWPORT_PX
    }
    case 'split':
      return ((placement.vw ?? 50) / 100) * NOMINAL_VIEWPORT_PX
    case 'fixed':
      return placement.px.large * 2
  }
}

const posterRung = (targetPx: number): number =>
  IMAGE_LADDER.find((width) => width >= targetPx) ?? IMAGE_LADDER[IMAGE_LADDER.length - 1]

/**
 * Sized Mux poster thumbnails riding the shared width ladder; the poster
 * `<img sizes>` comes from the same plan as the frame, so the browser picks
 * a rung matching the placement instead of downloading a full-res frame.
 * `src` rides the placement's own rung because the player poster attribute
 * gets no srcset.
 */
export const muxPosterRendering = (
  playbackId: string,
  placement: MediaPlacement,
): MuxPosterRendering => {
  return {
    src: muxPosterUrl(playbackId, posterRung(posterTargetPx(placement))),
    srcset: IMAGE_LADDER.map((w) => `${muxPosterUrl(playbackId, w)} ${w}w`).join(', '),
  }
}
