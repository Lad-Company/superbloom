# Performance Spec — Media pop-in + motion jank (homepage)

Status: proposed (spec only, no implementation). Follows PR #92
(`perf: edge-cache content SSR and load mux-player only on video frames`).

## Problem

On the homepage, after load:

1. **Video "folds in".** Media frames paint a gray box first, then the poster,
   then the video pops/fades in — the user can watch it load.
2. **Text reveal lags.** The hero heading stays blank, then animates in with
   visible jank.
3. **Scroll / GSAP feels heavy** for the first moments after load.

Goal: media appears already-present (no flicker, no loading), and text + scroll
+ every GSAP timeline is smooth. This spec is diagnosis + candidate fixes only.

## Root causes (confirmed in code)

### RC1 — No poster is painted until the mux chunk loads (`MediaFrame.astro`)
`<mux-player poster=… preload=…>` is SSR'd as an **un-upgraded custom element**,
which renders nothing. The `poster` lives on that element, so it only appears
after `connectedCallback` runs `await import('@mux/mux-player')` (~1 MB, dynamic)
and the element upgrades, fetches the poster, then buffers/plays. Painted
sequence: `media-frame` gray bg (`--fg-12`) → poster → video. That gap is the
"fold-in."

Aggravators:
- **No `preconnect`** to `image.mux.com` / `stream.mux.com` (`Layout.astro` head
  preloads only fonts), so the poster image and HLS manifest each pay a fresh
  DNS+TLS round trip.
- **Non-priority frames use `preload="none"`**, so even after upgrade nothing
  loads until the IntersectionObserver flips `active`, adding a second pop on
  scroll-in.
- The homepage stacks many players at once (hero + up to 8 Capes frames + Work +
  Zine + Why); each upgrades independently on the same tick.

### RC2 — Per-char animated blur on the hero heading (`PageHero.astro` + `reveal.ts`)
Hero H1 is `data-unit="chars" data-blur data-scroll="false"`. `revealText`:
1. sets `[data-motion-text]{opacity:0}` (CSS), then **awaits
   `document.fonts.ready`** before splitting — the heading is invisible for the
   whole font wait, then appears all at once.
2. splits a 200px display heading into dozens/hundreds of char `<span>`s, each
   with `will-change: transform, opacity` and **`filter: blur(12px) → blur(0)`**.
   Animating `filter: blur()` per char on a huge heading is the most expensive
   composite path available and is the primary text-jank source.

### RC3 — Everything initializes on one tick (`Layout.astro` `setup()`)
On every `astro:page-load`: Lenis init → `settleScrollPosition()` → `initMotion()`
(all Type Reveals split + tween) → `requestAnimationFrame(ScrollTrigger.refresh()
+ settleScrollPosition())`. In parallel the block scripts boot on the same event:
Capes `initPinnedStory` (pin spacer insertion) + `initDepthLayer`, and
HomeParallax `PointerFollowMedia` (a continuous rAF spring loop that calls
`getBoundingClientRect()` every frame). Pin-spacer insertion + SplitText DOM
mutation + a forced refresh in the first ~2 frames = synchronous reflow storms →
startup jank, and Lenis fights the double scroll-settle.

### RC4 — ~~Sustained GPU blur on Capes media~~ (`Capes.astro`) — RESOLVED
The live `filter: blur(7.5px)` + `transform: scale(1.1)` on Capes media has been
removed entirely, so the pinned scrub no longer composites a per-frame blurred
moving texture. (All 8 players still mount even though only one is visible; the
decode-cost half of this root cause lives on in C5.)

## Candidate fixes (prioritized)

Each is independent; ship highest-impact first.

### C1 — Paint the poster as a real `<img>` (kills the fold-in) — HIGH
In `MediaFrame.astro`, when the asset is `mux.video`, render an ordinary `<img>`
poster layer (the existing `videoPoster` Mux thumbnail URL) *behind* the
`<mux-player>`, sized identically (`object-fit: cover`, absolute inset:0):
- `loading`/`fetchpriority`/`decoding` mirror `priority` (hero = eager/high).
- The poster paints at first paint (no JS needed), so the frame is never a gray
  box.
- In the element script, hide the poster only once the player is truly ready —
  listen for `playing` (or `canplay` for `preload=auto`) and fade/remove it, so
  video replaces poster with no flash. Keep the poster if playback never starts
  (reduced-motion, paused, offscreen).

Acceptance: hard-refresh the homepage on a throttled connection; the hero shows
the poster immediately and the video swaps in with no gray frame and no visible
pop. Same for Capes/Work/Zine frames as they scroll in.

### C2 — Preconnect + hero poster preload (`Layout.astro`) — HIGH, cheap
Add to `<head>`:
```html
<link rel="preconnect" href="https://image.mux.com" crossorigin />
<link rel="preconnect" href="https://stream.mux.com" crossorigin />
```
Optionally `rel="preload" as="image"` the hero poster URL (only when the
homepage hero is a video) to get the first poster on the wire before hydration.

Acceptance: poster/manifest requests show reused connections (no per-request TLS)
in the network waterfall; hero poster starts downloading in the first wave.

### C3 — De-jank the hero Type Reveal (`PageHero.astro` + `reveal.ts`) — HIGH
- **Drop per-char blur on the hero.** Switch the hero H1 to `words` (or `lines`)
  and remove `data-blur`, or keep `chars` but remove the blur filter. Blur stays
  a reserved, rare accent — not the default hero path.
- **Don't block the reveal on fonts indefinitely.** Race `document.fonts.ready`
  against a short timeout (e.g. `Promise.race([fonts.ready, wait(200)])`) or
  `document.fonts.load()` for the specific hero face, so the heading never stays
  hidden waiting on fonts.
- **CSS safety net:** if JS hasn't revealed within ~N ms, an animation/transition
  fallback sets `opacity:1` so the heading can never get stuck blank.

Acceptance: hero heading is visible within one or two frames of first paint and
animates smoothly (60fps, no blur compositing spikes in a Performance trace).

### C4 — Sequence startup work off the critical frame (`Layout.astro`) — MEDIUM
- Run the hero reveal + Lenis first; defer non-critical inits (Capes pin, depth,
  pointer-follow) to the next idle/frame (`requestIdleCallback` fallback
  `setTimeout`), so pin-spacer insertion and SplitType mutation don't reflow on
  the same frame as the hero animation.
- Do a **single** `ScrollTrigger.refresh()` after layout settles, and call
  `settleScrollPosition()` once (avoid the double settle that fights Lenis).
- Consider lazy-creating each pinned/scrub section's ScrollTrigger only when it
  nears the viewport rather than all on load.

Acceptance: Performance trace of the first 1s after load shows no long task /
layout-thrash cluster; scrolling immediately after load is smooth.

### C5 — Reduce Capes decode cost (`Capes.astro`) — MEDIUM
- ~~Replace the live `filter: blur(7.5px)` on media~~ — done: the blur was
  removed entirely rather than replaced with a pre-blurred poster.
- Only mount/upgrade the mux-player for the **active + adjacent** frames; keep the
  rest as poster `<img>` until needed (pairs with C1). Avoids 8 concurrent HLS
  decodes.

Acceptance: during the Capes pin scrub, GPU/raster stays within frame budget
(no dropped frames in a trace) on a mid-tier laptop.

### C6 — Pointer-follow reflow (`PointerFollowMedia.astro`) — LOW
Cache each group's `getBoundingClientRect()` and recompute on
resize/scroll/refresh instead of every rAF tick, to drop the per-frame forced
reflow. Minor with one group; do it if it shows in a trace.

## Non-goals
- Implementation (this pass is spec only).
- Changing the motion contract in `docs/design-system.md` §5 (blur stays a
  reserved accent; reduced-motion behavior unchanged).
- Video/CDN provider changes (Mux stays per ADR-0004).

## Verification checklist (when implemented)
- Throttled hard-refresh of `/`: no gray→poster→video pop on hero, Capes, Work,
  Zine; hero text visible fast and smooth.
- Performance trace: no long tasks / layout-thrash cluster in first ~1s; Capes
  scrub holds frame budget.
- `astro check` clean, vitest green, eslint clean.
- Reduced-motion path unchanged (posters show, no reveals/scrub/blur).
</content>
</invoke>
