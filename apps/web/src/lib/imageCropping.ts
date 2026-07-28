import imageUrlBuilder from '@sanity/image-url'
import {sanityClient} from './sanity'

const builder = imageUrlBuilder(sanityClient)

export interface ImageSource {
  asset?: {_ref?: string | null; _type?: string | null} | null
  crop?:
    | {
        top?: number | null
        bottom?: number | null
        left?: number | null
        right?: number | null
      }
    | null
  hotspot?:
    | {
        x?: number | null
        y?: number | null
        height?: number | null
        width?: number | null
      }
    | null
}

export type CropRatio =
  | 'intrinsic'
  | '1:1'
  | '4:5'
  | '9:16'
  | '3:2'
  | '16:9'
  | '2:1'
  | 'fill'

type FixedRatio = Exclude<CropRatio, 'intrinsic' | 'fill'>

const RATIO_VALUE: Record<FixedRatio, number> = {
  '1:1': 1,
  '4:5': 4 / 5,
  '9:16': 9 / 16,
  '3:2': 3 / 2,
  '16:9': 16 / 9,
  '2:1': 2 / 1,
}

export const IMAGE_LADDER = [320, 640, 960, 1280, 1600, 1920, 2560] as const

export interface ImageRendering {
  src: string
  srcset?: string
  width: number
  height: number
}

export const urlFor = (source: ImageSource) => builder.image(source)

export const isSvgImage = (mimeType: string | null | undefined): boolean =>
  mimeType === 'image/svg+xml'

const sizeLadder = (nativeWidth: number): number[] =>
  IMAGE_LADDER.filter((width) => width <= nativeWidth)

// Picks a representative rung from the available ladder: the mid-rung is a
// sensible default when callers don't hint, and rung 0 is the ladder's
// smallest entry when only that fits the native width.
const pickLadderWidth = (ladder: readonly number[], fallback: number): number => {
  const midRung = ladder[Math.floor(ladder.length / 2)]
  if (typeof midRung === 'number') return midRung
  const firstRung = ladder[0]
  if (typeof firstRung === 'number') return firstRung
  return fallback
}

export const buildRatioUrl = (
  source: ImageSource,
  ratio: FixedRatio,
  width: number,
): string => {
  const height = Math.max(1, Math.round(width / RATIO_VALUE[ratio]))
  return urlFor(source).width(width).height(height).fit('crop').auto('format').url()
}

export const buildWidthOnlyUrl = (source: ImageSource, width: number): string =>
  urlFor(source).width(width).auto('format').url()

export const buildImageRendering = (params: {
  source: ImageSource
  mimeType?: string | null
  nativeWidth?: number | null
  nativeHeight?: number | null
  ratio: CropRatio
}): ImageRendering => {
  const {source, mimeType, nativeWidth, nativeHeight, ratio} = params
  const width = nativeWidth ?? 0
  const height = nativeHeight ?? 0

  if (isSvgImage(mimeType)) {
    const ref = source.asset?._ref
    return {
      src: ref ? urlFor(source).url() : '',
      width: width || 0,
      height: height || 0,
    }
  }

  const ladder = sizeLadder(width)
  const useFixedAspect = ratio !== 'fill' && ratio !== 'intrinsic'
  const buildUrl = (w: number) =>
    useFixedAspect
      ? buildRatioUrl(source, ratio as FixedRatio, w)
      : buildWidthOnlyUrl(source, w)

  const midRung = pickLadderWidth(ladder, width)
  const srcset = ladder.length
    ? ladder.map((w) => `${buildUrl(w)} ${w}w`).join(', ')
    : undefined

  return {
    src: buildUrl(midRung),
    srcset,
    width,
    height,
  }
}
