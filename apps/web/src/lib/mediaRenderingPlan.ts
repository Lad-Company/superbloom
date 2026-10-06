import {BREAKPOINTS} from './breakpoints'
import type {ContentCardSettings, CardWidth} from './contentCard'
import type {ContentLayoutWidth} from './contentLayout'
import {IMAGE_LADDER} from './imageLadder'

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

/** Mux `max_resolution` playback modifier — caps the HLS rendition ladder so
 *  small frames never pull 4K segments. Large canvas placements (hero,
 *  split, full layout blocks) keep 1080p; cards and fixed frames render far
 *  below 720p at any viewport, so 720p is lossless there. */
export type MuxMaxResolution = '1080p' | '720p'

export interface MediaRenderingPlan {
  sizes: string
  /** Resolved load priority: the placement's default unless overridden. */
  priority: boolean
  loading: 'eager' | 'lazy'
  fetchpriority: 'high' | 'auto'
  /** `<mux-video preload>` value paired with the priority. Priority frames
   *  fetch the manifest and init segment (`metadata`) so `play()` on
   *  intersection starts fast; `auto` pulled whole renditions up front. */
  preload: 'metadata' | 'none'
  maxResolution: MuxMaxResolution
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

const maxResolutionFor = (placement: MediaPlacement): MuxMaxResolution => {
  switch (placement.context) {
    case 'hero':
    case 'split':
      return '1080p'
    case 'layoutBlock':
      return !placement.width || placement.width === 'full' ? '1080p' : '720p'
    case 'card':
    case 'fixed':
      return '720p'
  }
}

export const planMediaRendering = (
  placement: MediaPlacement,
  options?: {priority?: boolean; maxResolution?: MuxMaxResolution},
): MediaRenderingPlan => {
  const priority = options?.priority ?? placement.context === 'hero'
  return {
    sizes: sizesFor(placement),
    priority,
    loading: priority ? 'eager' : 'lazy',
    fetchpriority: priority ? 'high' : 'auto',
    preload: priority ? 'metadata' : 'none',
    maxResolution: options?.maxResolution ?? maxResolutionFor(placement),
  }
}

export interface MuxPosterRendering {
  /** Placement-rung URL — the poster `<img src>` fallback under the srcset. */
  src: string
  srcset: string
}

const muxPosterUrl = (playbackId: string, width: number, time: number): string =>
  `https://image.mux.com/${playbackId}/thumbnail.webp?width=${width}&time=${time}`

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
 * `src` rides the placement's own rung as the no-srcset fallback.
 *
 * `thumbTime` is the poster frame the editors picked on the Mux asset in
 * Sanity (the mux input plugin's `thumbTime`, default 0). It matters beyond
 * taste: time=0 of an edited video can be a glitch/strobe leader frame that
 * reads wrong as a still and compresses terribly — the Who We Are lead's
 * time=0 frame was 263KB at the 960 rung where every other frame is 15-70KB.
 */
export const muxPosterRendering = (
  playbackId: string,
  placement: MediaPlacement,
  thumbTime?: number | null,
  widths?: readonly number[],
): MuxPosterRendering => {
  const time = thumbTime ?? 0
  const rungs = widths ?? IMAGE_LADDER
  return {
    src: muxPosterUrl(playbackId, widths ? rungs[0] : posterRung(posterTargetPx(placement)), time),
    srcset: rungs.map((w) => `${muxPosterUrl(playbackId, w, time)} ${w}w`).join(', '),
  }
}

/** Hero poster rungs (GH #172): Mux generates thumbnails on demand per
 *  width × time, and cold rungs measured 0.7–1.0s TTFB — the full ladder
 *  spread visitors across eight URLs, so the hi-res hero poster was
 *  routinely the last hero asset to land (1.37s). Pinning the hero to two
 *  rungs means every visitor warms the same two thumbnail URLs. */
export const HERO_POSTER_WIDTHS = [1280, 2560] as const

/** Blur-up rung for the MediaFrame skeleton surface (ADR-0039): a 24px
 *  thumbnail (~1-2KB) that the frame blurs into a placeholder for ungated
 *  video, which has no Sanity LQIP. Deliberately NOT in IMAGE_LADDER — it is
 *  only ever a skeleton background, never a srcset candidate. Uses the
 *  asset's thumbTime so the blur-up matches the poster frame exactly. */
const SKELETON_THUMB_PX = 24

export const muxSkeletonThumbUrl = (playbackId: string, thumbTime?: number | null): string =>
  muxPosterUrl(playbackId, SKELETON_THUMB_PX, thumbTime ?? 0)
