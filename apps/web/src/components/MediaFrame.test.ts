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
    expect(source).not.toMatch(/controls\?:\s*boolean\b/)
  })

  it('Ambient (controls="none") renders no control DOM', () => {
    expect(source).toContain("showControls = isVideo && controls !== 'none'")
    // The DOM stubs for the bar and the legacy bottom-right button are both
    // gated on `showControls`, so an Ambient frame never receives either.
    expect(source).toContain('showControls && isFullControls')
    expect(source).toContain('showControls && !isFullControls')
  })

  it('Full renders the Media Control Bar with play, scrubber, and mute hooks', () => {
    expect(source).toContain('data-media-controls')
    expect(source).toContain('data-media-control')
    expect(source).toContain('data-media-scrubber')
    expect(source).toContain('data-media-mute')
    // Scrubber exposes slider semantics for assistive technology.
    expect(source).toContain('role="slider"')
    expect(source).toContain('aria-label="Seek"')
    expect(source).toContain('aria-valuenow="0"')
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
    expect(source).toContain("addEventListener('seeked'")
    expect(source).toContain('onScrubberKey')
    expect(source).toContain("case 'ArrowLeft'")
    expect(source).toContain("case 'ArrowRight'")
    expect(source).toContain('SEEK_STEP_S')
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
    // Safari regressed on the attribute (mdn/browser-compat-data#24399) but
    // still honors the property, so wirePlayer() sets it on adoption.
    expect(source).toMatch(/<mux-video[^>]*\sdisablepictureinpicture[\s>]/s)
    expect(source).toMatch(/<video[^>]*\sdisablepictureinpicture[\s>]/s)
    expect(source).toContain('player.disablePictureInPicture = true')
  })

  describe('progressive loop (MP4 static renditions)', () => {
    it('renders a plain <video> only for eligible placements, mutually exclusive with HLS', () => {
      expect(source).toContain('progressiveLoopSources(asset.playbackId!, asset.staticRenditions)')
      // Presented and Gated frames keep HLS.
      expect(source).toMatch(/plan\.progressiveLoop && controls === 'none' && !isGated/)
      expect(source).toContain('class="media-frame__loop"')
      expect(source).toContain('isVideo && !isProgressiveLoop && (')
    })

    it('keeps iOS inline playback and the priority preload on the loop element', () => {
      expect(source).toMatch(/<video[^>]*\smuted\s[^>]*\sloop\s[^>]*\splaysinline[\s>]/s)
      expect(source).toContain("preload={plan.priority ? 'auto' : 'none'}")
    })

    it('makes loop autoplay declarative, with reduced-motion and pre-observation guards (GH #190)', () => {
      // The priority loop carries the autoplay attribute so the browser
      // starts muted playback on its own initiative and self-resumes after
      // bfcache restores — no JS timing window can drop the first play.
      // Priority only: the attribute implies an eager fetch, which a lazy
      // frame must never pay.
      expect(source).toContain("autoplay={plan.priority ? true : undefined}")
      // Reduced motion strips the attribute at connect (before first data)
      // and a preference flip restores it.
      expect(source).toContain('private syncAutoplayGate')
      expect(source).toContain("loop.removeAttribute('autoplay')")
      expect(source).toContain("loop.setAttribute('autoplay', '')")
      // Loop path and priority frames only — never the HLS surface.
      expect(source).toContain("loop?.classList.contains('media-frame__loop')")
      expect(source).toContain("this.hasAttribute('data-priority')")
      // The pause branch waits for the observer's first reading so a
      // browser-started autoplay can't be paused while isVisible is still
      // the initial false.
      expect(source).toContain('!shouldPlay && !isPaused && this.observedOnce')
      // bfcache restores re-run no lifecycle callbacks — re-evaluate on
      // pageshow(persisted), and take the listener with the element.
      expect(source).toContain('if (event.persisted) this.updatePlayback()')
      expect(source).toContain("window.addEventListener('pageshow', this.handlePageShow)")
      expect(source).toContain("window.removeEventListener('pageshow', this.handlePageShow)")
    })

    it('adopts the loop element synchronously and never imports the mux-video chunk for it', () => {
      expect(source).toContain("this.querySelector('video.media-frame__loop')")
      expect(source).toContain('this.wirePlayer(loopElement)')
      expect(source).toContain('if (!playerElement && !loopElement) return')
    })

    it('holds the poster only for explicit save-data intent (GH #192)', () => {
      // The downlink / cellular-class clauses were deleted: Chrome's Network
      // Information API downlink is a lagging EWMA read mid-parse, and on
      // 2026-10-08 it parked the hero on a connection that then played the
      // 720p loop smoothly in a forced probe. Viewport size is not a signal
      // — unlike the HLS constrained seed, a phone on wifi is fine.
      expect(source).not.toContain('PROGRESSIVE_LOOP_MIN_DOWNLINK_MBPS')
      const holdFn = source.match(/const shouldHoldForSaveData = \(\): boolean =>[^\n]*/)?.[0]
      expect(holdFn).toBeDefined()
      expect(holdFn).toContain('readConnection()?.saveData')
      expect(holdFn).not.toContain('downlink')
      expect(holdFn).not.toContain('effectiveType')
      expect(holdFn).not.toContain('matchMedia')
      expect(holdFn).not.toContain('cellularClass')
      expect(source).toContain('if (loopElement && shouldHoldForSaveData()) {')
      // Abort the parse-time fetch and never adopt the element as the player.
      expect(source).toContain("for (const source of loopElement.querySelectorAll('source')) source.remove()")
      expect(source).toContain('loopElement.load()')
      expect(source).toContain("this.setAttribute('data-loop-held', '')")
    })

    it('carries playback id and rendition cap on the loop host for the starvation swap', () => {
      expect(source).toContain('const loopPlaybackId =')
      expect(source).toContain('data-playback-id={loopPlaybackId ?? undefined}')
      expect(source).toContain('data-max-resolution={isProgressiveLoop ? plan.maxResolution : undefined}')
      // HLS frames keep their SSR playback-id attribute; the data-* pair is
      // the loop path's bridge to a runtime-built mux-video.
      expect(source).toMatch(/<media-frame[\s\S]*data-playback-id=\{loopPlaybackId/)
    })

    it('swaps a starved loop to constrained HLS exactly once (GH #192)', () => {
      expect(source).toContain('private loopFallback = false')
      expect(source).toContain('this.loopFallback = true')
      expect(source).toContain("this.setAttribute('data-loop-fallback', 'hls')")
      // Re-arm the opacity gate so the already-stamped host can't show the
      // new HLS surface before its first presented frame.
      expect(source).toContain("this.removeAttribute('data-video-ready')")
      expect(source).toContain("document.createElement('mux-video')")
      expect(source).toContain("fallback.setAttribute('playback-id', playbackId)")
      expect(source).toContain("fallback.setAttribute('stream-type', 'on-demand')")
      expect(source).toContain('fallback._hlsConfig = CONSTRAINED_AMBIENT_HLS_CONFIG')
      expect(source).toContain('loopElement.replaceWith(fallback)')
      // startLoop() resolves playerLoading for the no-chunk MP4 path; the
      // fallback must reset it or loadPlayer() would never import mux-video.
      expect(source).toContain('this.playerLoading = null')
      expect(source).toContain('void this.loadPlayer()')
      expect(source).toContain('this.teardownLoopMonitors(loopElement)')
      expect(source).toContain('this.unwirePlayer(loopElement)')
    })

    it('monitors starvation only after playback starts (GH #192)', () => {
      expect(source).toContain('createStallMonitor')
      expect(source).toContain('onStarved: this.handleLoopStarved')
      expect(source).toContain("loopElement.addEventListener('playing', this.handleLoopPlaying)")
      expect(source).toContain("loopElement.addEventListener('waiting', this.handleLoopWaiting)")
      expect(source).toContain("loopElement.addEventListener('pause', this.handleLoopPause)")
      // The GH #178 watchdog stays disjoint: playback requested with zero
      // data (readyState < 2) is a wedged load; the monitor's signature is
      // playback achieved, then starved.
      expect(source).toContain('player.paused || player.readyState >= 2')
    })

    it('recovers a save-data hold without a reload when saveData clears', () => {
      expect(source).toContain('private handleConnectionChange')
      expect(source).toContain("connection.addEventListener('change', this.handleConnectionChange)")
      expect(source).toContain("connection.addEventListener('connectionchange', this.handleConnectionChange)")
      expect(source).toContain("connection.removeEventListener('change', this.handleConnectionChange)")
      expect(source).toContain("connection.removeEventListener('connectionchange', this.handleConnectionChange)")
      expect(source).toContain('this.heldLoopSources')
      expect(source).toContain("this.removeAttribute('data-loop-held')")
      expect(source).toContain('this.startLoop(loopElement)')
      // Armed only in the held branch and always torn down.
      expect(source).toContain('this.setConnectionRecovery(true)')
      expect(source).toContain('this.setConnectionRecovery(false)')
    })

    it('recovers a wedged loop load exactly once (GH #178)', () => {
      // Firefox deadlocks a progressive-loop <video> adopted from the
      // ClientRouter's inert parsed document: metadata lands from the media
      // cache, the fetch suspends, play() resolves, then `waiting` and no
      // data events forever. The watchdog arms at connect and on `waiting`,
      // disarms on any real data signal or intentional stop, and after 4s of
      // requested-but-dataless playback re-runs the load algorithm once.
      expect(source).toContain('const LOOP_STALL_MS = 4000')
      expect(source).toContain('private armLoopStallWatchdog')
      // Loop path only — hls.js manages its own stalls on the HLS path.
      expect(source).toContain("loopElement.addEventListener('waiting', this.armLoopStallWatchdog)")
      expect(source).not.toContain("playerElement.addEventListener('waiting'")
      // Revival is gated on the actual wedge signature (playback requested,
      // no current data) and runs load() + play() at most once per element.
      expect(source).toContain('player.paused || player.readyState >= 2')
      expect(source).toContain('private loopRevived = false')
      expect(source).toContain("this.setAttribute('data-loop-revived', '')")
      // `suspend` fires on the wedged load itself (and on any full buffer),
      // so it must NOT be a disarm signal.
      const disarm = source.match(/LOOP_STALL_DISARM_EVENTS = \[([\s\S]*?)\]/)?.[1] ?? ''
      expect(disarm).toContain("'progress'")
      expect(disarm).toContain("'pause'")
      expect(disarm).not.toContain("'suspend'")
      // The timer and its listeners leave with the element (View Transition
      // swap teardown), or an armed watchdog would fire into a dead frame.
      // Loop monitors share one teardown used by disconnect and the GH #192
      // HLS fallback swap.
      expect(source).toContain('this.disarmLoopStallWatchdog()')
      expect(source).toContain('this.teardownLoopMonitors(this.player)')
      expect(source).toContain("player.removeEventListener('waiting', this.armLoopStallWatchdog)")
    })

    it('retries playback on the first user gesture after a policy rejection, and on a timer after a transient one (GH #190)', () => {
      // Safari's per-site "Never Auto-Play" rejects even muted play() with
      // NotAllowedError on a visible, buffered video; a real user gesture
      // lifts the block. Rejected plays arm one-time pointerdown/keydown
      // listeners that re-run updatePlayback().
      expect(source).toContain('private handlePlayRejection')
      expect(source).toContain("?.name === 'NotAllowedError'")
      expect(source).toContain('this.player.play?.().catch(this.handlePlayRejection)')
      expect(source).toContain("document.addEventListener('pointerdown', this.handlePlaybackGesture")
      expect(source).toContain("document.addEventListener('keydown', this.handlePlaybackGesture")
      expect(source).toContain('once: true')
      // Transient rejections (AbortError from a load()/pause() race) are
      // not policy: retry on a short timer, capped so a broken source can't
      // retry-loop forever, with the timer torn down on disconnect.
      expect(source).toContain('const TRANSIENT_RETRY_MS = 250')
      expect(source).toContain('const MAX_TRANSIENT_RETRIES = 3')
      expect(source).toContain('clearTimeout(this.transientRetryTimer)')
      // The armed listeners leave with the element (View Transition swap
      // teardown), or a dead frame would retry into a detached player.
      expect(source).toContain("document.removeEventListener('pointerdown', this.handlePlaybackGesture")
      expect(source).toContain("document.removeEventListener('keydown', this.handlePlaybackGesture")
    })
  })

  it('emits no poster attribute on mux-video and never copies one — the opacity gate covers the first-frame gap (GH #172)', () => {
    // A SSR `poster` takes one URL (no srcset), so every frame fetched its
    // thumbnail twice — and WebKit ignores object-fit: cover on the shadow
    // <video> poster (the Safari letterbox jump). The video layer's own
    // opacity gate covers the fade-to-first-frame gap instead.
    expect(source).not.toMatch(/<mux-video[^>]*\sposter=/s)
    expect(source).not.toContain('applyPlayerPoster')
    expect(source).not.toContain("setAttribute('poster'")
  })

  it('gates data-video-ready on a presented frame, not on playing (GH #172)', () => {
    // Safari (native HLS) fires `playing` before compositing the first
    // frame — stamping ready on `playing` dissolved the poster onto a
    // blank/gray video. requestVideoFrameCallback fires only when a frame
    // has actually been presented; the fallback is `playing` plus one rAF.
    expect(source).toContain("addEventListener('playing', this.handleReady)")
    expect(source).toContain('requestVideoFrameCallback')
    expect(source).toContain('requestAnimationFrame')
    expect(source).toContain("this.hasAttribute('data-video-ready')")
  })

  it('supports deferPoster: src-less poster with data-* until promotePoster()', () => {
    expect(source).toContain('deferPoster?: boolean')
    expect(source).toContain('data-src={deferPoster ? videoPoster.src : undefined}')
    expect(source).toContain('public promotePoster()')
  })

  it('disables the hls.js bandwidth test and seeds a generous ABR estimate for startup', () => {
    // testBandwidth: false + a 20 Mbps seed let firstAutoLevel start on the
    // highest rung the player-size cap allows; measured bandwidth replaces
    // the seed after the first fragment.
    expect(source).toContain('const STARTUP_HLS_CONFIG = {')
    expect(source).toContain('testBandwidth: false')
    expect(source).toContain('abrEwmaDefaultEstimate: 20_000_000')
  })

  it('gives Ambient frames the startup config plus the 10s buffer, Presented frames the startup config', () => {
    expect(source).toContain('...STARTUP_HLS_CONFIG')
    expect(source).toContain("this.dataset.controls === 'none' ? ambientConfig : startupConfig")
  })

  it('seeds a constrained 2 Mbps ABR estimate on save-data, cellular, and small viewports', () => {
    // The 20 Mbps seed opens on the top capped rung; on a throttled mobile
    // pipe that pulled ~17 MB of segments into one Lighthouse trace
    // (2026-10-01). The constrained seed starts low and climbs from the
    // first fragment measurement.
    expect(source).toContain('const CONSTRAINED_STARTUP_HLS_CONFIG = {')
    expect(source).toContain('abrEwmaDefaultEstimate: 2_000_000')
    expect(source).toContain('connection?.saveData')
    expect(source).toContain('constrained ? CONSTRAINED_STARTUP_HLS_CONFIG : STARTUP_HLS_CONFIG')
  })

  it('caps large-canvas frames at 720p on small viewports before the player upgrades', () => {
    expect(source).toContain("plan.maxResolution === '1080p' ? '720p' : undefined")
    expect(source).toContain('data-mobile-max-resolution={mobileMaxResolution}')
    expect(source).toContain("playerElement.setAttribute('max-resolution', mobileMaxResolution)")
  })

  it('bounds the ambient forward buffer to a flat 10s', () => {
    // 20s at the 9.6 Mbps top rung cost 23.6 MB in one Lighthouse run; a
    // flat 10s halves that worst case and still covers a short loop twice.
    expect(source).toContain('maxBufferLength: 10')
    expect(source).toContain('maxMaxBufferLength: 10')
  })
})

describe('MediaFrame consumers conform to the controls enum', () => {
  it('WhoWeAreFeaturedMedia passes the string enum and exposes it on its props', () => {
    const source = readFileSync(
      new URL('./who-we-are/WhoWeAreFeaturedMedia.astro', import.meta.url),
      'utf8',
    )
    expect(source).toContain('MediaPlaybackProfile')
    expect(source).toContain("controls?: MediaPlaybackProfile")
    expect(source).toContain("controls={controls}")
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
  it('renders a skeleton surface behind the media only when an asset exists', () => {
    expect(source).toContain('class="media-frame__skeleton"')
    expect(source).toContain('aria-hidden="true"')
    // The no-asset placeholder gradient stays the fallback for empty frames.
    expect(source).toMatch(/hasAsset && \([\s\S]*?media-frame__skeleton/)
  })

  it('upgrades the skeleton to the Sanity LQIP blur-up when the asset carries one', () => {
    expect(source).toContain('skeletonBackdrop')
    // Image assets use their own LQIP; Gated Ambient videos fall back to
    // the curated poster's LQIP.
    expect(source).toContain('asset.lqip ?? null')
    expect(source).toContain('poster?.lqip ??')
  })

  it('gives ungated video frames a Mux thumbnail blur-up, fetching nothing while deferred', () => {
    expect(source).toContain('muxSkeletonThumbUrl')
    // Deferred frames (Capes) must fetch nothing until promoted.
    expect(source).toMatch(/!deferPoster && asset\?\._type === 'mux\.video' && asset\.playbackId/)
    // Priority frames (heroes) inline the thumb at render so the first
    // frame is already a blur-up (GH #151).
    expect(source).toContain('await muxBlurUpDataUri(asset.playbackId, asset.thumbTime)')
  })

  it('projects lqip in the shared media projection (image + poster branches)', () => {
    expect(source).toContain('lqip?: string | null')
    const queries = readFileSync(new URL('../lib/queries.ts', import.meta.url), 'utf8')
    const projection = queries.slice(
      queries.indexOf('const mediaProjection'),
      queries.indexOf('export const contentLayoutRowsProjection'),
    )
    expect(projection.match(/"lqip": asset->metadata\.lqip/g)).toHaveLength(2)
  })

  it('gates the hidden-until-loaded rules on html.js, priority frames exempt (GH #162)', () => {
    // Without JS (or a failed chunk) media must render exactly as before.
    // Priority frames are the LCP element on /work and /index and the gate
    // held them invisible until the module-script queue ran, so they paint
    // on decode. The rules live in the global motion.css: Astro's scoped
    // compiler deadens an html.js gate inside the component.
    const motionCss = readFileSync(new URL('../styles/motion.css', import.meta.url), 'utf8')
    expect(motionCss).toMatch(/html\.js media-frame:not\(\[data-priority\]\) img\s*\{[^}]*opacity:\s*0/)
    expect(motionCss).not.toMatch(/html\.js media-frame img\s*\{[^}]*opacity:\s*0/)
  })

  it('crossfades each layer in on its load event', () => {
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
})

describe('MediaFrame hero entrance ceremony (GH #172)', () => {
  it('exposes a heroEntrance prop that stamps data-hero-entrance', () => {
    expect(source).toContain('heroEntrance?: boolean')
    expect(source).toContain('data-hero-entrance={heroEntrance ? true : undefined}')
  })

  it('pins the hero poster srcset to two shared Mux thumbnail rungs', () => {
    // Mux generates thumbnails on demand per width × time; cold rungs
    // measured 0.7–1.0s TTFB. Two rungs mean every visitor warms the same
    // URLs instead of spreading across the eight-rung ladder.
    expect(source).toContain('heroEntrance ? HERO_POSTER_WIDTHS : undefined')
    const plan = readFileSync(new URL('../lib/mediaRenderingPlan.ts', import.meta.url), 'utf8')
    expect(plan).toContain('export const HERO_POSTER_WIDTHS = [1280, 2560] as const')
  })

  it('only the homepage hero opts in — zine media hero stays plain', () => {
    const home = readFileSync(new URL('./home/HomepageComposition.astro', import.meta.url), 'utf8')
    expect(home).toContain('heroEntrance')
    const zine = readFileSync(new URL('./zine/IssueDetail.astro', import.meta.url), 'utf8')
    expect(zine).not.toContain('heroEntrance')
  })
})
