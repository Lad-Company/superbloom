import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./MediaFrame.astro', import.meta.url), 'utf8')

describe('MediaFrame playback profiles', () => {
  it('exposes a string controls prop with the three spec profiles', () => {
    expect(source).toContain("export type MediaPlaybackProfile")
    expect(source).toContain("'none' | 'compact' | 'full'")
    expect(source).toContain("controls?: MediaPlaybackProfile")
  })

  it('defaults to Ambient (controls="none") for backward compatibility', () => {
    expect(source).toContain("controls = 'none'")
  })

  it('drops the legacy boolean coercion in favor of the enum', () => {
    // No `boolean` type or `controls?: boolean` against the prop.
    expect(source).not.toMatch(/controls\?:\s*boolean\b/)
    expect(source).not.toMatch(/:\s*boolean\s*=.*\?:\s*boolean\s*=/)
  })

  it('Ambient (controls="none") renders no control DOM', () => {
    expect(source).toContain('controls !== \'none\'')
    expect(source).toContain("showControls = isVideo && controls !== 'none'")
    // The DOM stubs for the bar and the legacy bottom-right button are both
    // gated on `showControls`, so an Ambient frame never receives either.
    expect(source).toContain('showControls && isFullControls')
    expect(source).toContain('showControls && !isFullControls')
  })

  it('Compact renders only the legacy bottom-right play/pause button', () => {
    expect(source).toContain("class=\"media-control surface-wipe\"")
    expect(source).toContain('showControls && !isFullControls')
  })

  it('Full renders the Media Control Bar with play, scrubber, and mute toggle', () => {
    expect(source).toContain('class="media-controls"')
    expect(source).toContain('data-media-controls')
    expect(source).toContain('data-media-control')
    expect(source).toContain('role="slider"')
    expect(source).toContain('aria-label="Seek"')
    expect(source).toContain('aria-valuemin="0"')
    expect(source).toContain('aria-valuemax="0"')
    expect(source).toContain('aria-valuenow="0"')
    expect(source).toContain('aria-valuetext="0:00 / 0:00"')
    expect(source).toContain('data-media-scrubber')
    expect(source).toContain('data-scrubber-played')
    expect(source).toContain('data-scrubber-buffered')
    expect(source).toContain('data-scrubber-knob')
    expect(source).toContain('data-media-mute')
  })

  it('Media Control Bar buttons use the squircle reference shape (10px radius), not circles', () => {
    // The bar buttons render as squircles proportional to the Figma
    // reference (rounded square with ~25-30% corner radius). They are
    // distinct from the compact single-button affordance which the
    // spec describes as a 40px circle, gated by the
    // `.media-controls__btn` selector — that selector must NOT use
    // `border-radius: 50%`.
    expect(source).toMatch(/\.media-controls__btn[^{]*\{[^}]*border-radius:\s*10px/)
    expect(source).not.toMatch(/\.media-controls__btn[^{]*\{[^}]*border-radius:\s*50%/s)
  })

  it('Media Control Bar buttons share the .btn / surface-wipe hover recipe', () => {
    // Both play/pause and mute toggle opt into the Contained Control
    // surface-wipe class so they flip colors on hover/focus exactly like
    // every other .btn in the system. They also expose the wipe CSS
    // variables the motion.css rules consume.
    expect(source).toContain('media-controls__btn--play surface-wipe')
    expect(source).toContain('media-controls__btn--mute surface-wipe')
    expect(source).toContain('--wipe-surface: var(--control-fg)')
    expect(source).toContain('--wipe-ink: var(--control-bg)')
    expect(source).toContain('--wipe-outline: var(--surface-wipe-outline)')
  })

  it('bars space controls generously (gap ≥ 12px) so the play / scrubber / mute row breathes', () => {
    // Squircle icons at 40×40 read cramped at --space-xs-4 (8px); the bar
    // uses --space-3xs (12px) so the play, scrubber and mute have
    // deliberate air between them.
    expect(source).toMatch(/\.media-controls\s*\{[^}]*gap:\s*var\(--space-3xs\)/s)
  })

  it('Media Control Bar icons sit above the wipe pseudo so the hover color flip is visible', () => {
    // The .surface-wipe::before is z-1; if the icon container has no
    // explicit z-index it stacks behind the wipe overlay and the glyph
    // becomes invisible the moment the wipe scrolls up. The icon
    // container must match .surface-wipe .btn__label (z-2) so the
    // background flips behind the glyph while it stays painted.
    expect(source).toMatch(/\.media-controls__icon\s*\{[^}]*z-index:\s*2/s)
  })

  it('volume icon has breathing room between the speaker body and the wave / X glyph', () => {
    // Speaker body sits in the left half (x=4-13) so the wave arcs (x=16+)
    // and the muted X (x=16-21) have room to render without colliding
    // with the cone. Stroke is bumped to 1.8 with linejoin/linecap round
    // for the X so the muted state reads cleanly at 22px.
    expect(source).toContain('M4 9v6h4l5 4V5l-5 4H4z')
    expect(source).toContain('M16 9l5 6m0-6l-5 6')
    expect(source).toContain('M16 9a4 4 0 0 1 0 6')
    expect(source).toContain('M20 6a6 6 0 0 1 0 12')
    expect(source).toContain('stroke-linejoin="round"')
  })

  it('uses design tokens for control colors, spacing, radius, and motion', () => {
    // Colors via surface-resolved tokens (--control-fg / --bg-20 / --bg-60).
    expect(source).toContain('background: var(--control-bg)')
    expect(source).toContain('color: var(--control-fg)')
    expect(source).toContain('background: var(--bg-20)')
    expect(source).toContain('background: var(--bg-60)')
    expect(source).toContain('background: var(--control-fg)')
    // Radius from the system, not a magic number.
    expect(source).toContain('border-radius: var(--radius-control)')
    // Spacing tokens for the bar insets.
    expect(source).toContain('var(--space-3xs)')
    expect(source).toContain('var(--page-inset)')
    // Motion tokens for transitions (no bespoke durations).
    expect(source).toContain('var(--motion-quick)')
    expect(source).toContain('var(--motion-instant)')
    expect(source).toContain('var(--motion-ease-out)')
    // No drop shadows — design-system constraint §1.
    expect(source).not.toMatch(/box-shadow\s*:\s*[^v;]+;/)
  })

  it('keeps the existing Ambient engine (visibility, reduced-motion, userIntent)', () => {
    expect(source).toContain('IntersectionObserver')
    expect(source).toContain('prefers-reduced-motion: reduce')
    expect(source).toContain('visibilitychange')
    expect(source).toContain('userIntent')
    expect(source).toContain('data-video-ready')
  })

  it('auto-hides the bar on inactivity while playing and re-shows on activity', () => {
    expect(source).toContain('AUTO_HIDE_MS')
    expect(source).toContain('data-controls-hidden')
    expect(source).toContain('scheduleAutoHide')
    expect(source).toContain('markActivity')
  })

  it('wires the scrubber to player events and arrow-key navigation', () => {
    expect(source).toContain("addEventListener('timeupdate'")
    expect(source).toContain("addEventListener('durationchange'")
    expect(source).toContain("addEventListener('progress'")
    expect(source).toContain("addEventListener('seeked'")
    expect(source).toContain("addEventListener('loadedmetadata'")
    expect(source).toContain('onScrubberKey')
    expect(source).toContain("case 'ArrowLeft'")
    expect(source).toContain("case 'ArrowRight'")
    expect(source).toContain("case 'Home'")
    expect(source).toContain("case 'End'")
    expect(source).toContain('SEEK_STEP_S')
  })

  it('respects reduced-motion for transitions and scrub interactions', () => {
    expect(source).toContain('@media (prefers-reduced-motion: reduce)')
    expect(source).toContain('transition: none')
  })
})

describe('MediaFrame consumers conform to the new controls enum', () => {
  it('WhoWeAreFeaturedMedia passes the string enum and exposes it on its props', () => {
    const source = readFileSync(
      new URL('./who-we-are/WhoWeAreFeaturedMedia.astro', import.meta.url),
      'utf8',
    )
    expect(source).toContain('MediaPlaybackProfile')
    expect(source).toContain("controls?: MediaPlaybackProfile")
    expect(source).toContain("controls = 'full'")
    expect(source).toContain("controls={controls}")
    // No legacy boolean default.
    expect(source).not.toMatch(/controls\s*=\s*true\b/)
  })

  it('Case Study lead media promotes to Presented only when the lead asset is a Mux video', () => {
    const source = readFileSync(
      new URL('./case/CaseStudyComposition.astro', import.meta.url),
      'utf8',
    )
    expect(source).toContain(
      "controls={caseStudy.leadMedia.asset?._type === 'mux.video' ? 'full' : 'none'}",
    )
  })

  it('PageHero hero media mode stays Ambient (no controls prop)', () => {
    // The spec rolls Home + Zine + WhoWeAre into one row of "Presented," but
    // Pete reviewed the Figma and opted Home/Zine hero out — the file should
    // NOT pass `controls` to MediaFrame on the media-mode path.
    const source = readFileSync(
      new URL('./PageHero.astro', import.meta.url),
      'utf8',
    )
    expect(source).not.toMatch(/<MediaFrame[^>]*\bcontrols=/)
  })
})
