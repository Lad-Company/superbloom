import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./Carousel.astro', import.meta.url), 'utf8')
const rowSource = readFileSync(new URL('./ContentLayoutRow.astro', import.meta.url), 'utf8')

describe('Carousel', () => {
  it('renders every item at its intrinsic ratio, videos with full playback controls', () => {
    expect(source).toContain('ratio="intrinsic"')
    expect(source).toContain("controls={item.asset?._type === 'mux.video' ? 'full' : 'none'}")
    expect(source).toContain('--ratio:')
  })

  it('accepts both image and video items', () => {
    expect(source).toContain("item?.asset?._type === 'mux.video' && Boolean(item.asset.playbackId)")
    expect(source).toContain("item?.asset?._type === 'image' && Boolean(item.asset.asset?._ref)")
    // Image ratios come from the projected width/height metadata; videos
    // parse Mux's "W:H" aspect_ratio.
    expect(source).toContain('return width / height')
    expect(source).toContain('asset.aspectRatio?.match')
  })

  it('plays only the centered video, keeping neighbours paused until active', () => {
    expect(source).toContain('active={index === initialIndex}')
    expect(source).toContain("toggleAttribute('active', isActive)")
  })

  it('opens the full layout on the second item, flanked on both sides', () => {
    expect(source).toContain("layout === 'full' ? (items.length > 1 ? 1 : 0)")
    expect(source).toContain('data-active={index === initialIndex')
    expect(source).toContain("this.scrollToSlide(initialIndex, 'auto')")
  })

  it('opens split layouts on the first item, anchored to the text-side edge', () => {
    // textLeft keeps authored order (first item at DOM index 0); textRight
    // renders the track reversed so the first item sits at the right edge.
    expect(source).toContain("layout === 'textRight' ? ordered.length - 1 : 0")
    expect(source).toContain('[...items].reverse()')
    expect(source).toContain("this.layout === 'textRight'")
    expect(source).toContain('? this.slides.length - 1')
  })

  it('snaps split slides to the text-side edge so overflow shows only opposite the text', () => {
    expect(source).toContain('scroll-snap-type: x mandatory')
    expect(source).toContain('scroll-snap-align: center')
    expect(source).toContain("--bp-desktop")
    expect(source).toContain(".carousel[data-layout='textRight'] .slide")
    expect(source).toContain('scroll-snap-align: end')
    expect(source).toContain(".carousel[data-layout='textLeft'] .slide")
    expect(source).toContain('scroll-snap-align: start')
  })

  it('moves the track padding to the far edge so upcoming items trail past the gutter', () => {
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
    expect(source).toContain(
      "return this.layout === 'textRight' ? left + width - contentWidth : left",
    )
    expect(source).toContain('this.track.scrollLeft + this.anchorDelta(slide)')
  })

  it('anchors slides by layout geometry so the recede scale never skews them', () => {
    // getBoundingClientRect includes the 0.92 recede scale (and any
    // mid-transition value); measuring with it mis-anchored the active slide
    // by the shrink offset, leaving its leading edge — and the Media Control
    // Bar's leading button — clipped under the track edge. offset* geometry
    // is transform-free, so the scroll target always equals the snap
    // position.
    expect(source).toContain('slide.offsetLeft')
    expect(source).toContain('slide.offsetWidth')
    expect(source).not.toContain('getBoundingClientRect()')
    // The recede scale lives on .slide-inner, not the slide: the slide's
    // border box is its scroll-snap area, and Chrome resolves snap
    // destinations from the transformed box, so a scaled slide snaps off its
    // anchor by the shrink offset.
    expect(source).toContain('class="slide-inner"')
    expect(source).toContain('.slide[data-active] .slide-inner')
  })

  it('caps every item at the 16:9 slide height, whatever its ratio', () => {
    expect(source).toContain('--cap-h: calc(var(--slide-w) * 9 / 16)')
    expect(source).toContain('width: min(var(--slide-w), calc(var(--cap-h) * var(--ratio)))')
  })

  it('pushes the active item slightly forward in space', () => {
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
    expect(source).toContain('border: 1px solid var(--fg-20)')
    expect(source).toContain('border-radius: var(--radius-control)')
    // Same spacing as the Card Carousel's control group.
    expect(source).toContain('gap: var(--space-3xs)')
  })

  it('places the controls per layout: centered, or at the carousel bottom inner corner', () => {
    expect(source).toContain(".carousel[data-layout='full'] .controls")
    expect(source).toContain('justify-content: center')
    expect(source).toContain(".carousel[data-layout='textRight'] .controls")
    expect(source).toContain('justify-content: flex-end')
    expect(source).toContain(".carousel[data-layout='textLeft'] .controls")
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
    expect(source).toContain(".carousel[data-layout='textRight'] .stage")
    expect(source).toContain('margin-left: calc(-1 * var(--page-inset))')
    expect(source).toContain(".carousel[data-layout='textLeft'] .stage")
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

  it('passes the media, layout, and text box content through from the row block', () => {
    expect(rowSource).toContain('media={block.media}')
    expect(rowSource).toContain('layout={block.layout}')
    expect(rowSource).toContain('text={block.text}')
  })

  it('is wired into Content Layout Rows as a block', () => {
    expect(rowSource).toContain("block._type === 'contentLayoutCarousel'")
    expect(rowSource).toContain('<Carousel')
  })
})
