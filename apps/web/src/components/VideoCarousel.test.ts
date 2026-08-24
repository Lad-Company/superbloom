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
    expect(source).toContain('active={index === initialIndex}')
    expect(source).toContain("toggleAttribute('active', isActive)")
  })

  it('opens the full layout on the second video, flanked on both sides', () => {
    expect(source).toContain("layout === 'full' ? (playable.length > 1 ? 1 : 0)")
    expect(source).toContain('data-active={index === initialIndex')
    expect(source).toContain("this.scrollToSlide(initialIndex, 'auto')")
  })

  it('opens split layouts on the first video, anchored to the text-side edge', () => {
    // textLeft keeps authored order (first video at DOM index 0); textRight
    // renders the track reversed so the first video sits at the right edge.
    expect(source).toContain("layout === 'textRight' ? ordered.length - 1 : 0")
    expect(source).toContain('[...playable].reverse()')
    expect(source).toContain("this.layout === 'textRight'")
    expect(source).toContain('? this.slides.length - 1')
  })

  it('snaps split slides to the text-side edge so overflow shows only opposite the text', () => {
    expect(source).toContain('scroll-snap-type: x mandatory')
    expect(source).toContain('scroll-snap-align: center')
    expect(source).toContain("--bp-desktop")
    expect(source).toContain(".video-carousel[data-layout='textRight'] .slide")
    expect(source).toContain('scroll-snap-align: end')
    expect(source).toContain(".video-carousel[data-layout='textLeft'] .slide")
    expect(source).toContain('scroll-snap-align: start')
  })

  it('moves the track padding to the far edge so upcoming videos trail past the gutter', () => {
    expect(source).toContain('--ratio-first')
    expect(source).toContain('--ratio-last')
    expect(source).toContain(
      "padding-inline: calc(100cqw - min(var(--slide-w), calc(var(--cap-h) * var(--ratio-first)))) 0",
    )
    expect(source).toContain(
      "padding-inline: 0 calc(100cqw - min(var(--slide-w), calc(var(--cap-h) * var(--ratio-last))))",
    )
  })

  it('scrolls split layouts in the direction opposite the text', () => {
    // textRight's reversed track flips logical navigation in DOM order.
    expect(source).toContain("return this.layout === 'textRight' ? -1 : 1")
    expect(source).toContain('this.goTo(this.activeIndex - this.navDir)')
    expect(source).toContain('this.goTo(this.activeIndex + this.navDir)')
    // Anchored scrolling aligns the slide's text-side edge, not its center.
    expect(source).toContain('slideRect.right - trackRect.right')
    expect(source).toContain('slideRect.left - trackRect.left')
  })

  it('caps every video at the 16:9 slide height, whatever its ratio', () => {
    expect(source).toContain('--cap-h: calc(var(--slide-w) * 9 / 16)')
    expect(source).toContain('width: min(var(--slide-w), calc(var(--cap-h) * var(--ratio)))')
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

  it('styles prev/next like the Card Carousel, grouped below the track', () => {
    expect(source).toContain('class="control previous surface-wipe"')
    expect(source).toContain('class="control next surface-wipe"')
    expect(source).toContain('border: 1px solid var(--fg-25)')
    expect(source).toContain('border-radius: var(--radius-control)')
    // Same spacing as the Card Carousel's control group.
    expect(source).toContain('gap: var(--space-3xs)')
  })

  it('places the controls per layout: centered, or at the carousel bottom inner corner', () => {
    expect(source).toContain(".video-carousel[data-layout='full'] .controls")
    expect(source).toContain('justify-content: center')
    expect(source).toContain(".video-carousel[data-layout='textRight'] .controls")
    expect(source).toContain('justify-content: flex-end')
    expect(source).toContain(".video-carousel[data-layout='textLeft'] .controls")
    expect(source).toContain('justify-content: flex-start')
  })

  it('supports a 3/4 carousel with a top-aligned 1/4 text box on either side', () => {
    expect(source).toContain('data-layout={layout}')
    expect(source).toContain("layout === 'textRight'")
    expect(source).toContain("layout === 'textLeft'")
    expect(source).toContain('<PortableText')
    expect(source).toContain('align-items: start')
    // textRight: carousel columns 1–9, text columns 10–12.
    expect(source).toContain('grid-column: 1 / 10')
    expect(source).toContain('grid-column: 10 / -1')
    // textLeft: text columns 1–3, carousel columns 4–12.
    expect(source).toContain('grid-column: 1 / 4')
    expect(source).toContain('grid-column: 4 / -1')
  })

  it('overflows only the edge farthest from the text, past the page gutter', () => {
    expect(source).toContain(".video-carousel[data-layout='textRight'] .stage")
    expect(source).toContain('margin-left: calc(-1 * var(--page-inset))')
    expect(source).toContain(".video-carousel[data-layout='textLeft'] .stage")
    expect(source).toContain('margin-right: calc(-1 * var(--page-inset))')
  })

  it('stacks split layouts below desktop with the track bleeding both edges', () => {
    expect(source).toContain('grid-template-columns: 1fr')
    expect(source).toContain('margin-inline: calc(-1 * var(--page-inset))')
  })

  it('bleeds the row edge-to-edge only for the full-width layout', () => {
    expect(rowSource).toContain("'carousel-bleed': carouselBleed")
    expect(rowSource).toContain('.content-layout-row.carousel-bleed')
    expect(rowSource).toContain("(blocks[0].layout ?? 'full') === 'full'")
  })

  it('passes the layout and text box content through from the row block', () => {
    expect(rowSource).toContain('layout={block.layout}')
    expect(rowSource).toContain('text={block.text}')
  })

  it('renders video assets only, matching the schema contract', () => {
    expect(source).toContain("video?.asset?._type === 'mux.video'")
  })

  it('is wired into Content Layout Rows as a block', () => {
    expect(rowSource).toContain("block._type === 'contentLayoutCarousel'")
    expect(rowSource).toContain('<VideoCarousel')
  })
})
