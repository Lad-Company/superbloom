import {describe, expect, it} from 'vitest'
import {planMediaRendering, muxPosterRendering, type MediaPlacement} from './mediaRenderingPlan'
import {cardImageSizes, CARD_WIDTHS, INFO_POSITIONS, type ContentCardSettings} from './contentCard'
import {contentLayoutSizes, type ContentLayoutWidth} from './contentLayout'

const sizes = (placement: MediaPlacement) => planMediaRendering(placement).sizes

describe('planMediaRendering — the sizing table', () => {
  it.each<[string, MediaPlacement, string]>([
    ['uncapped hero', {context: 'hero'}, '100vw'],
    [
      'capped hero (case study / article lead)',
      {context: 'hero', capPx: 1440},
      '(max-width: 1439.98px) 100vw, 1440px',
    ],
    [
      'capped fractional hero (article detail)',
      {context: 'hero', capPx: 1440, fraction: 0.9},
      '(max-width: 1599.98px) 90vw, 1440px',
    ],
    [
      'capped narrow band (editorial rail)',
      {context: 'hero', capPx: 960},
      '(max-width: 959.98px) 100vw, 960px',
    ],
    [
      'grid card, info below',
      {
        context: 'card',
        settings: {cardWidth: '1/2', mediaAspectRatio: '16:9', infoPosition: 'below'},
      },
      '(max-width: 1023.98px) 100vw, 50vw',
    ],
    [
      'grid card, info beside halves the picture',
      {
        context: 'card',
        settings: {cardWidth: '1/2', mediaAspectRatio: '16:9', infoPosition: 'right'},
      },
      '(max-width: 1023.98px) 100vw, 25vw',
    ],
    [
      'rail card follows the contentCardRail.css collapse table',
      {
        context: 'card',
        settings: {cardWidth: '1/2', mediaAspectRatio: '16:9', infoPosition: 'below'},
        rail: true,
      },
      '(max-width: 599.98px) min(76vw, 280px), (max-width: 959.98px) min(56vw, 360px), 50vw',
    ],
    [
      'layout block on the 12-col grid',
      {context: 'layoutBlock', width: '1/3'},
      '(max-width: 1023.98px) 100vw, 33vw',
    ],
    ['full layout block', {context: 'layoutBlock', width: 'full'}, '100vw'],
    ['full-bleed layout block', {context: 'layoutBlock', width: 'full', fullBleed: true}, '100vw'],
    ['split at desktop collapse', {context: 'split'}, '(max-width: 1023.98px) 100vw, 50vw'],
    [
      'split at small collapse (Who We Are two-ups)',
      {context: 'split', collapseAt: 'small'},
      '(max-width: 767.98px) 100vw, 50vw',
    ],
    [
      'split with an authored slot width (home work mosaic)',
      {context: 'split', vw: 62},
      '(max-width: 1023.98px) 100vw, 62vw',
    ],
    [
      'fixed thumbnails (past issues)',
      {context: 'fixed', px: {small: 96, large: 210}},
      '(max-width: 767.98px) 96px, 210px',
    ],
  ])('%s', (_name, placement, expected) => {
    expect(sizes(placement)).toBe(expected)
  })
})

describe('planMediaRendering — priority bundle', () => {
  it('heroes default to priority loading', () => {
    expect(planMediaRendering({context: 'hero'})).toMatchObject({
      priority: true,
      loading: 'eager',
      fetchpriority: 'high',
      preload: 'auto',
    })
  })

  it('everything else defaults lazy', () => {
    expect(planMediaRendering({context: 'split'})).toMatchObject({
      priority: false,
      loading: 'lazy',
      fetchpriority: 'auto',
      preload: 'none',
    })
  })

  it('an explicit priority overrides the placement default (carousel initial slide)', () => {
    expect(planMediaRendering({context: 'split'}, {priority: true}).loading).toBe('eager')
    expect(planMediaRendering({context: 'hero'}, {priority: false}).preload).toBe('none')
  })
})

/**
 * Migration parity (temporary — delete with the legacy helpers): the planner
 * must emit byte-identical strings to the hand-written paths it replaces,
 * except the documented normalizations (redundant `full` media condition,
 * `.98` cap boundaries) and deliberate fixes (rail accuracy, sized posters).
 */
describe('parity with legacy sizing helpers', () => {
  it('matches cardImageSizes for every settings combination', () => {
    for (const cardWidth of CARD_WIDTHS) {
      for (const infoPosition of INFO_POSITIONS) {
        const settings: ContentCardSettings = {cardWidth, mediaAspectRatio: '16:9', infoPosition}
        expect(sizes({context: 'card', settings})).toBe(cardImageSizes(settings))
      }
    }
  })

  it('matches contentLayoutSizes for every non-full width', () => {
    const widths: ContentLayoutWidth[] = ['1/4', '1/3', '1/2', '2/3', '3/4']
    for (const width of widths) {
      expect(sizes({context: 'layoutBlock', width})).toBe(contentLayoutSizes(width))
    }
  })

  it('normalizes the redundant full-width media condition', () => {
    expect(contentLayoutSizes('full')).toBe('(max-width: 1023.98px) 100vw, 100vw')
    expect(sizes({context: 'layoutBlock', width: 'full'})).toBe('100vw')
  })
})

describe('muxPosterRendering', () => {
  const rendering = muxPosterRendering('abc123')

  it('serves webp at the mid ladder rung', () => {
    expect(rendering.src).toBe('https://image.mux.com/abc123/thumbnail.webp?width=1280&time=0')
  })

  it('offers the full width ladder as srcset', () => {
    expect(rendering.srcset.split(', ')).toEqual([
      'https://image.mux.com/abc123/thumbnail.webp?width=320&time=0 320w',
      'https://image.mux.com/abc123/thumbnail.webp?width=640&time=0 640w',
      'https://image.mux.com/abc123/thumbnail.webp?width=960&time=0 960w',
      'https://image.mux.com/abc123/thumbnail.webp?width=1280&time=0 1280w',
      'https://image.mux.com/abc123/thumbnail.webp?width=1600&time=0 1600w',
      'https://image.mux.com/abc123/thumbnail.webp?width=1920&time=0 1920w',
      'https://image.mux.com/abc123/thumbnail.webp?width=2560&time=0 2560w',
    ])
  })
})
