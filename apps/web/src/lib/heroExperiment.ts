import type {HomepageQueryResult} from '../sanity.types'

/**
 * TEMPORARY — hero delivery experiment. Delete once the HLS-vs-MP4 /
 * 12s-vs-8s comparison is decided.
 *
 * `/?hero=<hls|mp4>&clip=<12|8>` swaps the home hero's video asset for one of
 * the two clipped loop assets and forces the delivery path, so four
 * scenarios can be measured from one deployment without touching content.
 * Any other query (or none) leaves the page untouched.
 */

const CLIPS = {
  '12': {
    playbackId: 'L01JAd5vWzKjOHMkuZMFfRsOcpqwIiYRCbg6kegCjSN8',
    renditions: [
      {resolution: '720p', name: '720p.mp4', width: 1280, height: 720},
      {resolution: '1080p', name: '1080p.mp4', width: 1920, height: 1080},
    ],
  },
  '8': {
    playbackId: 'tAS8F3Ok61i8eK3D5iLBnNVJHnuiF5wfj2F01P8ZjZ6Y',
    renditions: [
      {resolution: '720p', name: '720p.mp4', width: 1280, height: 720},
      {resolution: '1080p', name: '1080p.mp4', width: 1920, height: 1080},
    ],
  },
} as const

export const applyHeroExperiment = (
  homepage: HomepageQueryResult,
  params: URLSearchParams,
): HomepageQueryResult => {
  const mode = params.get('hero')
  const clip = params.get('clip')
  if ((mode !== 'hls' && mode !== 'mp4') || (clip !== '12' && clip !== '8')) return homepage
  if (!homepage?.hero?.heroMedia) return homepage
  const {playbackId, renditions} = CLIPS[clip]
  return {
    ...homepage,
    hero: {
      ...homepage.hero,
      heroMedia: {
        ...homepage.hero.heroMedia,
        asset: {
          _type: 'mux.video',
          playbackId,
          aspectRatio: '16:9',
          thumbTime: null,
          staticRenditions: mode === 'mp4' ? [...renditions] : [],
        },
      },
    },
  }
}
