import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {BREAKPOINTS} from './breakpoints'
import {CARD_WIDTHS} from './contentCard'
import {
  planMediaRendering,
  muxPosterRendering,
  muxSkeletonThumbUrl,
  progressiveLoopSources,
  type MediaPlacement,
} from './mediaRenderingPlan'

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
    [
      'capped full layout block (article media band)',
      {context: 'layoutBlock', width: 'full', capPx: 1440},
      '(max-width: 1439.98px) 100vw, 1440px',
    ],
    [
      'capped narrow layout block (editorial rail band)',
      {context: 'layoutBlock', width: 'full', capPx: 960},
      '(max-width: 959.98px) 100vw, 960px',
    ],
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
      // metadata, not auto: fetch the manifest + init segment up front but
      // let the intersection-driven play() pull the actual media segments.
      preload: 'metadata',
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

describe('planMediaRendering — maxResolution caps the HLS rendition ladder', () => {
  it.each<[string, MediaPlacement, '1080p' | '720p']>([
    ['uncapped hero', {context: 'hero'}, '1080p'],
    ['capped hero', {context: 'hero', capPx: 1440}, '1080p'],
    ['split', {context: 'split'}, '1080p'],
    ['full layout block', {context: 'layoutBlock', width: 'full'}, '1080p'],
    ['unset-width layout block', {context: 'layoutBlock'}, '1080p'],
    ['full-bleed layout block', {context: 'layoutBlock', width: 'full', fullBleed: true}, '1080p'],
    ['grid layout block', {context: 'layoutBlock', width: '1/3'}, '720p'],
    [
      'grid card',
      {context: 'card', settings: {cardWidth: '1/2', mediaAspectRatio: '16:9', infoPosition: 'below'}},
      '720p',
    ],
    [
      'rail card',
      {
        context: 'card',
        settings: {cardWidth: 'full', mediaAspectRatio: '16:9', infoPosition: 'below'},
        rail: true,
      },
      '720p',
    ],
    ['fixed frame', {context: 'fixed', px: {small: 96, large: 210}}, '720p'],
  ])('%s gets %s', (_name, placement, expected) => {
    expect(planMediaRendering(placement).maxResolution).toBe(expected)
  })

  it('an explicit override beats the placement default (Capes ambient stack)', () => {
    expect(
      planMediaRendering({context: 'layoutBlock', width: 'full'}, {maxResolution: '720p'})
        .maxResolution,
    ).toBe('720p')
    expect(planMediaRendering({context: 'card', settings: {cardWidth: '1/2', mediaAspectRatio: '16:9', infoPosition: 'below'}}, {maxResolution: '1080p'}).maxResolution).toBe('1080p')
  })
})

describe('rail widths — contract with contentCardRail.css', () => {
  // The CSS is the single source of truth for rail card widths; the planner
  // hardcodes mirrors of its literals. Re-derive every value from the file
  // (the breakpoints.test.ts / ADR-0024 pattern) so the mirror cannot drift.
  const railCss = readFileSync(new URL('../styles/contentCardRail.css', import.meta.url), 'utf8')
  const desktopWidths = new Map(
    [...railCss.matchAll(/\[data-card-width='([^']+)'\]\s*\{\s*width:\s*([^;]+);/g)].map((m) => [
      m[1],
      m[2],
    ]),
  )
  const collapseWidths = new Map(
    [...railCss.matchAll(/@media \(--bp-(\d+)\)[^{]*\{[^{]*\{\s*width:\s*([^;]+);/g)].map((m) => [
      Number(m[1]),
      m[2],
    ]),
  )

  it('reads the full width table from the CSS', () => {
    expect([...desktopWidths.keys()].sort()).toEqual([...CARD_WIDTHS].sort())
    expect([...collapseWidths.keys()].sort()).toEqual([600, 960])
  })

  it('collapses at the canonical rail breakpoints', () => {
    expect(BREAKPOINTS.railTightMax).toBe(600 - 0.02)
    expect(BREAKPOINTS.railNarrowMax).toBe(960 - 0.02)
  })

  it.each([...CARD_WIDTHS])('rail %s card sizes reproduce the CSS width table', (cardWidth) => {
    expect(
      planMediaRendering({
        context: 'card',
        settings: {cardWidth, mediaAspectRatio: '16:9', infoPosition: 'below'},
        rail: true,
      }).sizes,
    ).toBe(
      `(max-width: ${BREAKPOINTS.railTightMax}px) ${collapseWidths.get(600)}, ` +
        `(max-width: ${BREAKPOINTS.railNarrowMax}px) ${collapseWidths.get(960)}, ` +
        `${desktopWidths.get(cardWidth)}`,
    )
  })
})

describe('muxPosterRendering', () => {
  const rendering = muxPosterRendering('abc123', {context: 'hero'})

  // The player poster attribute takes exactly one URL (no srcset), so the
  // src rides a rung estimated from the placement: viewport fractions at a
  // nominal 1440px desktop, capped bands at their cap, fixed frames at 2x.
  it.each<[string, MediaPlacement, number]>([
    ['an uncapped hero', {context: 'hero'}, 1600],
    ['a capped hero (case study / article lead)', {context: 'hero', capPx: 1440}, 1600],
    [
      'a grid card',
      {
        context: 'card',
        settings: {cardWidth: '1/3', mediaAspectRatio: '16:9', infoPosition: 'below'},
      },
      640,
    ],
    [
      'a rail card',
      {
        context: 'card',
        settings: {cardWidth: '1/2', mediaAspectRatio: '16:9', infoPosition: 'below'},
        rail: true,
      },
      960,
    ],
    ['a full layout block (Capes, carousel)', {context: 'layoutBlock', width: 'full'}, 1600],
    ['a capped band', {context: 'layoutBlock', width: 'full', capPx: 960}, 960],
    ['a grid layout block', {context: 'layoutBlock', width: '1/3'}, 640],
    ['a split', {context: 'split'}, 960],
    ['a mosaic slot (home work)', {context: 'split', vw: 62}, 960],
    ['fixed thumbnails (past issues)', {context: 'fixed', px: {small: 96, large: 210}}, 640],
    ['fixed collage frames (home feature)', {context: 'fixed', px: {small: 444, large: 444}}, 960],
  ])('picks the rung for %s', (_name, placement, width) => {
    expect(muxPosterRendering('abc123', placement).src).toBe(
      `https://image.mux.com/abc123/thumbnail.webp?width=${width}&time=0`,
    )
  })

  it('threads the editor-picked Sanity thumbTime through every URL', () => {
    // time=0 of an edited video can be a glitch/strobe leader frame that
    // compresses terribly (the Who We Are lead was 263KB at 960w), so the
    // mux plugin's thumbTime wins when set.
    const timed = muxPosterRendering('abc123', {context: 'hero'}, 0.5)
    expect(timed.src).toBe('https://image.mux.com/abc123/thumbnail.webp?width=1600&time=0.5')
    expect(timed.srcset).toContain('https://image.mux.com/abc123/thumbnail.webp?width=640&time=0.5 640w')
    expect(timed.srcset).not.toContain('time=0 ')
    // Null (asset has no thumbTime) falls back to the first frame.
    expect(muxPosterRendering('abc123', {context: 'hero'}, null).src).toBe(
      'https://image.mux.com/abc123/thumbnail.webp?width=1600&time=0',
    )
  })

  it('offers the full width ladder as srcset', () => {
    expect(rendering.srcset.split(', ')).toEqual([
      'https://image.mux.com/abc123/thumbnail.webp?width=192&time=0 192w',
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

describe('muxSkeletonThumbUrl (ADR-0039 blur-up for ungated video)', () => {
  it('is a fixed tiny 24px rung, off the width ladder', () => {
    expect(muxSkeletonThumbUrl('abc123')).toBe(
      'https://image.mux.com/abc123/thumbnail.webp?width=24&time=0',
    )
  })

  it('threads the editor-picked thumbTime so the blur-up matches the poster', () => {
    expect(muxSkeletonThumbUrl('abc123', 0.5)).toBe(
      'https://image.mux.com/abc123/thumbnail.webp?width=24&time=0.5',
    )
    expect(muxSkeletonThumbUrl('abc123', null)).toContain('time=0')
  })
})

describe('progressive loop — MP4 static renditions for the hero', () => {
  const card: MediaPlacement = {
    context: 'card',
    settings: {cardWidth: '1/2', mediaAspectRatio: '16:9', infoPosition: 'below'},
  }

  it('only the hero placement is eligible', () => {
    expect(planMediaRendering({context: 'hero'}).progressiveLoop).toBe(true)
    expect(planMediaRendering({context: 'hero', capPx: 1440}).progressiveLoop).toBe(true)
    for (const placement of [
      card,
      {context: 'split'} as MediaPlacement,
      {context: 'layoutBlock', width: 'full'} as MediaPlacement,
      {context: 'fixed', px: {small: 64, large: 96}} as MediaPlacement,
    ]) {
      expect(planMediaRendering(placement).progressiveLoop).toBe(false)
    }
  })

  it('serves 720p under the small breakpoint and 1080p above when both exist', () => {
    expect(
      progressiveLoopSources('pb', [
        {resolution: '1080p', name: '1080p.mp4'},
        {resolution: '720p', name: '720p.mp4'},
      ]),
    ).toEqual([
      {src: 'https://stream.mux.com/pb/720p.mp4', media: `(max-width: ${BREAKPOINTS.smallMax}px)`},
      {src: 'https://stream.mux.com/pb/1080p.mp4'},
    ])
  })

  it('falls back to the single rendition present, with no media query', () => {
    expect(progressiveLoopSources('pb', [{resolution: '720p', name: '720p.mp4'}])).toEqual([
      {src: 'https://stream.mux.com/pb/720p.mp4'},
    ])
    expect(progressiveLoopSources('pb', [{resolution: 'highest', name: 'highest.mp4'}])).toEqual([
      {src: 'https://stream.mux.com/pb/highest.mp4'},
    ])
  })

  it('returns null with no usable MP4 so the frame streams HLS', () => {
    expect(progressiveLoopSources('pb', null)).toBeNull()
    expect(progressiveLoopSources('pb', [])).toBeNull()
    expect(progressiveLoopSources('pb', [{resolution: null, name: null}])).toBeNull()
  })
})
