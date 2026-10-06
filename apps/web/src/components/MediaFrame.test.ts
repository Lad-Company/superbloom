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
    // with the cone. The wave arcs are concentric ~90° sweeps around the
    // cone tip (13,12) at radii 4.5 / 8.5 — a uniform 4-unit gap between
    // bars, so they neither overlap nor sprawl — and the outer bar tops
    // out at x=21.5 (+0.9 stroke), inside the 24-unit viewBox so the
    // active icon is never clipped by the icon edge. Stroke is bumped to
    // 1.8 with linejoin/linecap round for the X so the muted state reads
    // cleanly at 22px.
    expect(source).toContain('M4 9v6h4l5 4V5l-5 4H4z')
    expect(source).toContain('M16 9l5 6m0-6l-5 6')
    expect(source).toContain('M16.2 8.8a4.5 4.5 0 0 1 0 6.4')
    expect(source).toContain('M19 6a8.5 8.5 0 0 1 0 12')
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

  it('sets playsinline on mux-video so iOS never hijacks gesture-driven play into the fullscreen player', () => {
    // Without playsinline, iPhone Safari forces any play() issued inside a
    // user gesture (gated-card reveal tap, Presented play/mute buttons) into
    // the fullscreen native player — the "tap opens the video player"
    // disruption. custom-media-element only serializes host attributes onto
    // the shadow <video>, so the attribute must live on <mux-video> here.
    expect(source).toMatch(/<mux-video[^>]*\splaysinline[\s>]/s)
  })

  it('disables picture-in-picture on mux-video — attribute in markup, property set at wire-up for Safari', () => {
    // The attribute keeps PiP out of native context menus (desktop
    // right-click, iPadOS long-press) and the Firefox hover toggle.
    // Safari regressed on the attribute (mdn/browser-compat-data#24399) but
    // still honors the property, so loadPlayer() sets it after upgrade.
    expect(source).toMatch(/<mux-video[^>]*\sdisablepictureinpicture[\s>]/s)
    expect(source).toContain('this.player.disablePictureInPicture = true')
  })

  it('emits no SSR poster attribute on mux-video — the player poster is copied from the overlay img at upgrade', () => {
    // A SSR `poster` takes one URL (no srcset), so every frame fetched its
    // thumbnail twice. loadPlayer() copies the overlay poster's currentSrc
    // instead — guaranteed cache hit.
    expect(source).not.toMatch(/<mux-video[^>]*\sposter=/s)
    expect(source).toContain('applyPlayerPoster')
    expect(source).toContain("this.posterImg?.currentSrc || this.posterImg?.src")
  })

  it('supports deferPoster: src-less poster with data-* until promotePoster()', () => {
    expect(source).toContain('deferPoster?: boolean')
    expect(source).toContain('data-src={deferPoster ? videoPoster.src : undefined}')
    expect(source).toContain('data-srcset={deferPoster ? videoPoster.srcset : undefined}')
    expect(source).toContain('public promotePoster()')
  })

  it('disables the hls.js bandwidth test and seeds a generous ABR estimate for startup', () => {
    // With testBandwidth on, hls.js opens on playlist index 0 (a mid-ladder
    // 540p rung on Mux); with the default 500kbps estimate firstAutoLevel
    // rejects every Mux rung. testBandwidth: false + a 20 Mbps seed let
    // firstAutoLevel start on the highest rung the player-size cap allows —
    // 20 Mbps clears the largest measured 1080p-capped top rung (15.8 Mbps,
    // 2026-09-30) so the size cap is the sole selector. Measured bandwidth
    // replaces the seed after the first fragment.
    expect(source).toContain('const STARTUP_HLS_CONFIG = {')
    expect(source).toContain('testBandwidth: false')
    expect(source).toContain('abrEwmaDefaultEstimate: 20_000_000')
    // No _hls start-level pinning survives — startup is config-only.
    expect(source).not.toContain('pinAmbientStartLevel')
    expect(source).not.toContain('startLevel')
    expect(source).not.toContain('autoLevelCapping')
    // The size cap stays a playback-core default; writing it ourselves (or
    // the cap-rendition-to-player-size attribute on the element) would
    // bypass the MinCapLevelController that enforces max-resolution.
    expect(source).not.toContain('capLevelToPlayerSize:')
    expect(source).not.toMatch(/<mux-video[^>]*cap-rendition-to-player-size/s)
  })

  it('gives Ambient frames the startup config plus the 10s buffer, Presented frames the startup config', () => {
    expect(source).toContain('...STARTUP_HLS_CONFIG')
    expect(source).toContain("this.dataset.controls === 'none' ? ambientConfig : startupConfig")
  })

  it('seeds a constrained 2 Mbps ABR estimate on save-data, cellular, and small viewports', () => {
    // The 20 Mbps seed opens on the top capped rung; on a throttled mobile
    // pipe that pulled ~17 MB of segments into one Lighthouse trace before
    // the measured estimate could correct it (2026-10-01). The constrained
    // seed starts low and climbs from the first fragment measurement. The
    // small-viewport clause covers mobile browsers where the Network
    // Information API is absent (Safari) or reports the raw downlink.
    expect(source).toContain('const CONSTRAINED_STARTUP_HLS_CONFIG = {')
    expect(source).toContain('abrEwmaDefaultEstimate: 2_000_000')
    expect(source).toContain('...CONSTRAINED_STARTUP_HLS_CONFIG')
    expect(source).toContain('connection?.saveData')
    expect(source).toContain("['slow-2g', '2g', '3g'].includes(connection.effectiveType)")
    expect(source).toContain('constrained ? CONSTRAINED_STARTUP_HLS_CONFIG : STARTUP_HLS_CONFIG')
  })

  it('caps large-canvas frames at 720p on small viewports before the player upgrades', () => {
    // 1080p placements (hero / split / full layoutBlock) get a
    // data-mobile-max-resolution the element applies pre-upgrade, so a phone
    // never opens the 15.8 Mbps top rung it can't resolve anyway.
    expect(source).toContain("plan.maxResolution === '1080p' ? '720p' : undefined")
    expect(source).toContain('data-mobile-max-resolution={mobileMaxResolution}')
    expect(source).toContain("playerElement.setAttribute('max-resolution', mobileMaxResolution)")
  })

  it('dev guardrail watches startup config and the playback-core cap default on all frames', () => {
    // Runs for every frame (no controls gate on the startup assertions) and
    // keeps the buffer-cap check ambient-only — Presented frames
    // intentionally keep the deeper default buffer.
    expect(source).toContain('hlsConfig.testBandwidth !== false')
    expect(source).toContain('hlsConfig.capLevelToPlayerSize !== true')
    expect(source).toContain("this.dataset.controls === 'none' &&")
    expect(source).not.toMatch(/import\.meta\.env\.DEV\s*&&\s*this\.dataset\.controls/)
  })

  it('bounds the ambient forward buffer to a flat 10s', () => {
    // 20s at the 9.6 Mbps top rung cost 23.6 MB in one Lighthouse run; a
    // flat 10s halves that worst case and still covers a short loop twice.
    expect(source).toContain('maxBufferLength: 10')
    expect(source).toContain('maxMaxBufferLength: 10')
    expect(source).not.toContain('maxMaxBufferLength: 20')
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

  it('Capes defers inactive frame posters and promotes them on chapter change', () => {
    // The pinned stack sits inside the lazy-load threshold, so undeferred
    // posters all fetch at first layout, ahead of the LCP.
    const source = readFileSync(new URL('./blocks/Capes.astro', import.meta.url), 'utf8')
    expect(source).toContain('deferPoster={i > 0}')
    expect(source).toContain('promotePoster(i)')
    expect(source).toContain('promotePoster(i + 1)')
  })
})

describe('MediaFrame skeleton surfaces + LQIP crossfade (ADR-0039)', () => {
  it('renders a skeleton surface behind the media whenever an asset exists', () => {
    expect(source).toContain('class="media-frame__skeleton"')
    expect(source).toContain('aria-hidden="true"')
    // Only real assets get a skeleton; the no-asset placeholder gradient
    // stays the fallback for empty frames.
    expect(source).toMatch(/hasAsset && \([\s\S]*?media-frame__skeleton/)
  })

  it('skeleton is absolute inside the reserved box (no layout cost, CLS 0)', () => {
    expect(source).toMatch(/\.media-frame__skeleton\s*\{[^}]*position:\s*absolute/)
    expect(source).toMatch(/\.media-frame__skeleton\s*\{[^}]*inset:\s*0/)
  })

  it('positions the primary image layer so it paints above the positioned skeleton', () => {
    // CSS paints positioned descendants above non-positioned in-flow content
    // regardless of DOM order: a static <img> would sit UNDER the absolute
    // skeleton forever (the HITL-caught "permanent blur" regression). The
    // poster / curated-poster layers are already absolute; the primary image
    // gets position: relative via its own class — adding it to the base
    // `.media-frame img` rule instead would outspecificity the poster's
    // `position: absolute` (0,1,1 beats 0,1,0) and break video frames.
    expect(source).toContain('class="media-frame__image"')
    expect(source).toMatch(/\.media-frame__image\s*\{[^}]*position:\s*relative/)
  })

  it('upgrades the skeleton to the Sanity LQIP blur-up when the asset carries one', () => {
    expect(source).toContain('skeletonBackdrop')
    expect(source).toContain('background-image: url(')
    // Image assets use their own LQIP; Gated Ambient videos fall back to
    // the curated poster's LQIP.
    expect(source).toContain('asset.lqip ?? null')
    expect(source).toContain('poster?.lqip ??')
  })

  it('gives ungated video frames a tiny Mux thumbnail blur-up skeleton', () => {
    // Ungated video has no Sanity LQIP; without this the biggest canvases
    // on the site (home hero, shop hero) sat on a flat gray box until the
    // poster arrived — the "no poster" gap from HITL review.
    expect(source).toContain('muxSkeletonThumbUrl')
    // Deferred frames (Capes) must fetch nothing until promoted.
    expect(source).toMatch(/!deferPoster && asset\?\._type === 'mux\.video' && asset\.playbackId/)
    // Priority frames (heroes) inline the thumb at render so the first frame
    // is already a blur-up (GH #151 HITL: a bare grey hero once the veil was
    // gone); the URL remains the fallback when the fetch misses.
    expect(source).toContain('await muxBlurUpDataUri(asset.playbackId, asset.thumbTime)')
    expect(source).toMatch(/muxSkeletonUrl && plan\.priority/)
    expect(source).toContain('muxSkeletonInline ?? muxSkeletonUrl')
    expect(source).toContain('media-frame__skeleton-image')
    // Every ~20-24px source gets a blur that scales with the frame (container
    // units) plus a scale-up so the blur's edge fade stays outside the clip;
    // a fixed-px blur left JPEG blocks visible as crosshatching on large frames.
    expect(source).toMatch(/\.media-frame__skeleton\s*\{[^}]*container-type:\s*inline-size/)
    expect(source).toMatch(/\.media-frame__skeleton-image\s*\{[^}]*filter:\s*blur\(\d+cqw\)/)
    expect(source).toMatch(/\.media-frame__skeleton-image\s*\{[^}]*transform:\s*scale\(/)
  })

  it('types the LQIP field on the image projection', () => {
    expect(source).toContain('lqip?: string | null')
  })

  it('projects lqip in the shared media projection (image + poster branches)', () => {
    const queries = readFileSync(new URL('../lib/queries.ts', import.meta.url), 'utf8')
    const projection = queries.slice(
      queries.indexOf('const mediaProjection'),
      queries.indexOf('export const contentLayoutRowsProjection'),
    )
    // Both the image branch and the curated poster branch carry it.
    expect(projection.match(/"lqip": asset->metadata\.lqip/g)).toHaveLength(2)
  })

  it('derives --fg-12 locally via color-mix so the skeleton resolves on any surface', () => {
    // The base token is a literal black-12% that reads blank on dark or
    // colored surfaces; a :root color-mix would bake :root's --fg at
    // declaration time. MediaFrame re-declares it like --fg-8 /
    // CartDrawer / Navigation.
    expect(source).toMatch(/\.media-frame\s*\{[^}]*--fg-12:\s*color-mix\(in srgb, var\(--fg\) 12%, transparent\)/)
  })

  it('starts non-priority layers at opacity 0 over the skeleton, gated on html.js — in motion.css', () => {
    // Without JS (or a failed chunk) media must render exactly as before —
    // the hide rule only applies when Layout's inline script has marked
    // the document JS-capable. Priority frames (data-priority) are exempt:
    // their layers are the LCP element on /work and /index, and the gate
    // held them invisible until the module-script queue ran (GH #162), so
    // they paint as soon as the browser decodes them. The rules must live
    // in the global motion.css: Astro's scoped compiler deadens an html.js
    // gate inside the component (bare :where(html.js) gets the scope
    // attribute fused onto html; :where(:global(html.js)) emits an empty
    // :where() — verified in-browser 2026-10-02).
    const motionCss = readFileSync(new URL('../styles/motion.css', import.meta.url), 'utf8')
    expect(motionCss).toMatch(/html\.js media-frame:not\(\[data-priority\]\) img\s*\{[^}]*opacity:\s*0/)
    // The exemption is the priority attribute only — no other frame opts out.
    expect(motionCss).not.toMatch(/html\.js media-frame img\s*\{[^}]*opacity:\s*0/)
    // …and no equivalent rule remains in the scoped component style
    // (selector + brace, so the explanatory comment doesn't false-positive).
    expect(source).not.toMatch(/:where\([^)]*html\.js[^)]*\)\s*\.media-frame\s*img[^{]*\{/)
  })

  it('crossfades each layer in on its load event at --motion-quick', () => {
    const motionCss = readFileSync(new URL('../styles/motion.css', import.meta.url), 'utf8')
    expect(motionCss).toMatch(/html\.js media-frame img\[data-loaded\]\s*\{[^}]*opacity:\s*1/)
    expect(motionCss).toMatch(
      /html\.js media-frame img\[data-loaded\]\s*\{[^}]*transition:\s*opacity var\(--motion-quick\) var\(--motion-ease-out\)/,
    )
    expect(source).toContain("img.addEventListener('load', this.handleImgLoad)")
    expect(source).toContain("img.setAttribute('data-loaded', '')")
  })

  it('marks already-complete layers synchronously (cache, View Transitions, bfcache)', () => {
    // Requires a resolved URL so deferred posters (no src yet, complete ===
    // true) stay on the listener path until promotePoster() fires load.
    expect(source).toContain('img.currentSrc && img.complete && img.naturalWidth > 0')
  })

  it('removes the load listener in disconnectedCallback', () => {
    expect(source).toContain("img.removeEventListener('load', this.handleImgLoad)")
  })

  it('preserves the tuned fade-out timings against the quick load crossfade', () => {
    // The data-loaded transition would otherwise outrank the base rules:
    // video-ready keeps --motion-standard, the Poster Punch keeps
    // deliberate zoom + delayed 560ms fade.
    expect(source).toMatch(
      /\.media-frame\[data-video-ready\] \.media-frame__poster\s*\{[^}]*transition:\s*opacity var\(--motion-standard\)/,
    )
    expect(source).toMatch(
      /\.media-frame\[revealed\] \.media-frame__curated-poster\s*\{[^}]*transform var\(--motion-deliberate\)/,
    )
  })

  it('is instant under prefers-reduced-motion', () => {
    const reduceBlock = source.slice(source.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduceBlock).toContain('.media-frame img[data-loaded]')
  })
})
