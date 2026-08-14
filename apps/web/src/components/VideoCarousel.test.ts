import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./VideoCarousel.astro', import.meta.url), 'utf8')
const rowSource = readFileSync(new URL('./ContentLayoutRow.astro', import.meta.url), 'utf8')

describe('Video Carousel', () => {
  it('renders every video at its intrinsic ratio with full playback controls', () => {
    expect(source).toContain('ratio="intrinsic"')
    expect(source).toContain('controls="full"')
    expect(source).toContain('--ratio:')
  })

  it('plays only the centered video, keeping neighbours paused until active', () => {
    expect(source).toContain('active={index === 0}')
    expect(source).toContain("toggleAttribute('active', isActive)")
  })

  it('snaps slides to center with neighbours peeking past the track padding', () => {
    expect(source).toContain('scroll-snap-type: x mandatory')
    expect(source).toContain('scroll-snap-align: center')
    expect(source).toContain('--ratio-first')
    expect(source).toContain('--ratio-last')
  })

  it('pushes the active video slightly forward in space', () => {
    expect(source).toContain('transform: scale(0.92)')
    expect(source).toContain('.slide[data-active]')
  })

  it('hides the Media Control Bar and pointer input on receded slides', () => {
    expect(source).toContain('.slide:not([data-active]) :global(.media-controls)')
    expect(source).toContain('.slide:not([data-active]) :global(.media-frame)')
  })

  it('keeps arrow keys on the scrubber when focus is inside a video', () => {
    expect(source).toContain("closest('media-frame')")
  })

  it('renders video assets only, matching the schema contract', () => {
    expect(source).toContain("video?.asset?._type === 'mux.video'")
  })

  it('is wired into Content Layout Rows as a block', () => {
    expect(rowSource).toContain("block._type === 'contentLayoutCarousel'")
    expect(rowSource).toContain('<VideoCarousel')
  })
})
