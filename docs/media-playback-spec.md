# Media Playback Spec — unified play/pause, poster, and scrub

Status: proposed (spec only, no implementation). Sibling to
`docs/performance-spec.md` (media pop-in) and `docs/design-system.md` §5 (motion).
All video playback lives in one primitive, `MediaFrame.astro`; this spec unifies
its playback contract across every surface and adds a presented-media control bar
(play/pause + scrubber) for heroes and full-viewport media.

## Goal

One coherent, accessible, performant playback contract for every `mux.video`
frame on the site:

1. **Card / background video** pauses whenever it is out of the viewport (and when
   the tab is hidden, or reduced-motion is on). No visible controls.
2. **Hero / full-viewport video** exposes an explicit **play/pause button** plus a
   **scrubber/timeline**, so a user can control the one large video they are
   actually looking at.
3. The play/pause affordance is the button already in `MediaFrame` (the circular
   control shown in the reference screenshot).
4. The scrubber is drawn from existing design tokens so it reads as part of the
   Superbloom system, not a browser default.

## Non-goals

- Implementation, agent-browser, or agent-QA (this pass is spec only).
- Replacing Mux or `mux-player` (ADR-0004 stands).
- Native `mux-player` chrome — its built-in controls stay disabled
  (`--controls: none`); we render our own.
- Audio design. Videos remain `muted loop` (autoplay policy + current schema);
  a mute toggle is called out as an explicit open question, not a requirement.
- Poster art direction for content cards (curated poster + reveal gating) —
  owned by `docs/card-poster-reveal-spec.md`; see the Gated Ambient row in §2.

---

## 1. Current state (confirmed in `MediaFrame.astro`)

`MediaFrame` already implements most of the ambient contract and the play/pause
button; it has **no scrubber** and the hero does **not** opt into controls.

- **Poster** — for a `mux.video` asset it paints a real `<img>`
  (`https://image.mux.com/<id>/thumbnail.jpg?time=0`) *under* the `<mux-player>`,
  absolute `inset:0`, `object-fit: cover`. `priority` frames load it
  `eager`/`fetchpriority=high`; others `lazy`. The poster fades out
  (`--motion-standard`) once the element gets `data-video-ready` (`playing` /
  `canplay`). Poster stays painted whenever the video is not showing a frame.
- **Visibility-aware playback** — an `IntersectionObserver` (`threshold: 0`), the
  document `visibilitychange` event, and a `prefers-reduced-motion` MediaQuery
  drive `updatePlayback()`: a frame plays only when
  `active && isVisible && documentVisible && !reducedMotion`. Offscreen /
  background-tab / reduced-motion → paused. (Design-system §2 already promises
  this: "hidden/offscreen/background-tab video is always paused.")
- **Play/pause button** — rendered only when `controls` is truthy: a 40px circular
  button, bottom-right (`--space-3xs` inset), `background: var(--fg)` /
  `color: var(--bg)`, `.surface-wipe` press + hover, cross-fading play/pause SVGs,
  `aria-pressed` + `aria-label` kept in sync. A click sets a sticky
  `userIntent` (`'playing' | 'paused'`) that overrides autoplay: an explicit play
  even survives reduced-motion; an explicit pause survives scroll-in.
- **Consumers today** — `controls` is passed only by
  `WhoWeAreFeaturedMedia.astro` (`controls=true` default). `PageHero.astro`
  (media mode) and every card (`HomeWork`, `EditorialCard`, `Capes`, `HomeZine`,
  `TwoUp`, case/article media, …) render `MediaFrame` with **no controls** — so
  the hero has no play/pause and nothing has a scrubber.

**Gap summary:** playback pausing is solid; heroes lack any control; there is no
timeline anywhere; the `controls` boolean can't express "button only" vs
"button + scrubber."

---

## 2. Two playback profiles

Every `MediaFrame` video resolves to exactly one profile. This is the unification.

| Profile | Who | Controls | Autoplay | Poster load |
|---|---|---|---|---|
| **Ambient** | Cards, grids, background/decor media (default) | none | muted loop, visibility-gated | lazy (eager if `priority`) |
| **Gated Ambient** | Video cards with a curated Poster Image (`mediaBox.poster`) | none | muted loop, visibility-gated **and reveal-gated** — dormant until hover/focus/tap slides the poster away | curated poster lazy (eager if `priority`); Mux still beneath |
| **Presented** | Hero + full-viewport / featured media | play/pause **+ scrubber** | muted loop, visibility-gated | eager (`priority`) |

Gated Ambient is not a new `controls` value — no control DOM is involved. It
is Ambient plus a playback gate (`revealed`) driven by the card link, owned by
`docs/card-poster-reveal-spec.md`.

Proposed API: replace the `controls` boolean with a `controls` enum on
`MediaFrame` (keep the boolean coercion for one release so existing callers don't
break):

```ts
controls?: 'none' | 'compact' | 'full'   // 'none' = Ambient; 'full' = Presented
// back-compat: controls === true → 'full', false/undefined → 'none'
```

- `'none'` — Ambient. No control DOM.
- `'compact'` — play/pause button only (today's `controls=true` behavior), for the
  rare mid-page featured video that isn't full-viewport.
- `'full'` — Presented: play/pause button + scrubber control bar.

### Surface assignments

| Surface | Component | Profile |
|---|---|---|
| Home hero (3:2), Zine hero (16:9) | `PageHero.astro` media mode | **Presented (`full`)** |
| Who We Are featured media | `WhoWeAreFeaturedMedia.astro` | **Presented (`full`)** — upgrade current `compact` |
| Case Study lead media | `CaseStudyComposition.astro` | **Presented (`full`)** if full-bleed video; else Ambient |
| Case Study section media | `ContentLayoutRow.astro` via `CaseStudyNarrativeSection` / `Results` (`mediaControls="full"`); `VideoCarousel.astro` | **Presented (`full`)** for every `mux.video` block |
| All Content Cards / grids | `HomeWork`, `EditorialCard`, `WorkCard` media, `TwoUp`, `MediaSection`, `ArticleMediaSection`, `ContentLayoutRow` (article body rows), `HomeZine`, `HomeWhy`, `PastIssues` | **Ambient** |
| Pointer-follow cluster | `PointerFollowMedia.astro` | **Ambient** (decorative, no controls) |
| Capes pinned stack | `Capes.astro` | **Ambient, excluded from controls** — playback is scroll-driven storytelling, not a watchable clip; see §7 |

---

## 3. Unified poster behavior (codify what exists + close gaps)

Applies to **every** `mux.video` frame regardless of profile:

- A real `<img>` poster (Mux `thumbnail.jpg?time=0`) is always painted beneath the
  player so the frame is never a gray box (already implemented; keep).
- The poster is visible whenever the video is **not** actively presenting frames:
  before ready, while paused, while offscreen, and under reduced-motion.
- **Priority resolves from profile, not an ad-hoc `priority` prop only:** Presented
  frames load the poster eagerly and preload the player; Ambient frames stay lazy.
  (The homepage hero poster preload / `preconnect` items in
  `docs/performance-spec.md` C1/C2 are the companion perf work and are assumed.)
- Reduced-motion + Presented: show the poster and the play button; do not autoplay.
  A user can still press play (existing `userIntent` path).

No poster change is required for correctness today; this section fixes the intent
so future callers don't diverge.

---

## 4. Ambient profile (cards / background)

Behavior is the current `MediaFrame` engine; this spec only *ratifies* it as the
default and states the guarantees:

- Muted, looping, `preload="none"` unless `priority`.
- Plays only while `active && intersecting && document-visible && !reduced-motion`.
- Pauses on: leaving the viewport, tab blur, reduced-motion enabled, `active=false`
  (e.g. a non-current Capes/`active` frame).
- No control DOM, no scrubber, not focusable, not in the tab order.

**Sub-goal "cards pause when out of viewport":** met by the existing
`IntersectionObserver`. One refinement to consider (open question OQ3): raise the
observer threshold from `0` to a small margin (e.g. `rootMargin: '0px'` +
threshold ~`0.1`, or `rootMargin: '-10%'`) so a card that is only a sliver
on-screen doesn't hold a decode; today `threshold: 0` keeps it playing at 1px.

---

## 5. Presented profile (hero / full-viewport) — the new work

A Presented frame renders a **Media Control Bar** overlaid on the video, above the
scrim, below any headline/CTA overlay. It contains the existing play/pause button
and a new scrubber. It is the only place a scrubber appears.

### 5.1 Behavior

- Still muted + loop + visibility-gated by default (autoplay muted on scroll-in,
  pause offscreen/hidden) — the control bar adds *user override*, it does not
  change the ambient gating.
- **Play/pause button** — reuse the existing `.media-control` button and its
  `userIntent` logic verbatim. This is the button in the reference screenshot.
- **Scrubber** reflects `currentTime / duration` as a filled progress track, shows
  buffered range, and lets the user seek (click / drag / keyboard). Seeking sets
  `userIntent = 'playing'` unless the user is paused.
- **Loop + timeline:** with `loop`, `timeupdate` resets the fill at wrap; that is
  acceptable. (If a hero clip shouldn't loop once controls exist, that is OQ2.)
- **Auto-hide (optional, OQ4):** the bar may fade out after inactivity while
  playing and reappear on pointer move / focus / pause. Default for v1: **always
  visible** on Presented media for discoverability and simplicity.

### 5.2 Events / state (informative, for the implementer)

- Read: `timeupdate`, `durationchange`, `progress` (buffered), `play`, `pause`,
  `seeking`/`seeked`.
- Seek: set `player.currentTime`; while dragging, pause `timeupdate`-driven fill
  updates and drive the fill from the pointer position so it doesn't fight.
- All wiring lives inside the existing `MediaFrameElement` custom element
  lifecycle (`connectedCallback` / `disconnectedCallback`) so teardown on
  `astro:before-swap` stays correct.

---

## 6. Control design — tokens, not browser chrome

Everything below is expressed in existing tokens (`tokens.css`, `motion.css`) so
the control bar matches the system. **No shadows; media radius stays 0; controls
use `--radius-control` (6px).**

### 6.1 Play/pause button (unchanged)

Keep as-is: 40px circle, `--space-3xs` inset, `background: var(--fg)` /
`color: var(--bg)`, `.surface-wipe` (Contained Control primitive — Surface Wipe +
`scale(0.98)` press), cross-fading play/pause glyphs, `:focus-visible` outline.
In the Presented bar it sits at the **left** of the bar (see layout) rather than
free-floating bottom-right.

### 6.2 Scrubber / timeline

Visual:

- **Track:** full-width within the bar, height **4px** (hover/focus grows to 6px),
  `border-radius: var(--radius-control)` clamped to the track height (pill).
  Base (unplayed) track: `var(--bg-20)` on dark media; buffered: a slightly
  stronger tint of the same (`var(--bg-60)` on dark). Played fill:
  `var(--fg)` resolved against the media (on the dark hero that is white).
  Colors resolve through the surface role like the button (`--control-bg` /
  `--control-fg`), so the same component reads correctly on light or dark media.
- **Handle:** small round knob (10–12px) in the fill color, appears/scales up on
  hover, focus, and drag; hidden-but-present at rest for a clean line. Sits on the
  Contained-Control language, no shadow.
- **Bar container (optional frosted variant):** if the bar needs separation from
  busy footage, back it with the frosted layer — `background: var(--frosted-layer)`
  (`--bg-20`) + `backdrop-filter: blur(var(--frosted-layer-blur))` (35px) —
  matching the design-system frosted overlay. Default v1: no container fill,
  controls sit directly on the scrim so the hero reads clean; revisit per Figma.
- **Optional time label:** if shown, use **PP Neue Corp Tight** (`--font-interface`,
  the `label`/`caption` role) — never Graphik. v1 default: **no numeric time**,
  keep it minimal.

Motion (all from `motion.css` tokens; every transition inside a reduced-motion
guard):

- Track/handle grow on hover: `--motion-quick` (240ms) `--motion-ease-out`.
- Press / seek commit: `--motion-instant` (120ms).
- Fill position while playing follows `timeupdate` (no easing — it tracks real
  time); do **not** animate width per frame with a transition (jank).
- Button keeps its `.surface-wipe` timing.

### 6.3 Layout

- Bar pinned to the bottom inset of the media (`--space-3xs` on small, up to
  `--page-inset` on desktop), above `.scrim`, below `.overlay` headline/CTA.
- Row: `[ play/pause ] [ ——— scrubber (flex:1) ——— ]`, gap `--space-xs-4` (8px).
  A mute toggle, if ever added (OQ1), joins the right edge.
- Must not collide with the hero headline/CTA overlay; on the home hero the
  overlay CTA is `grid-column 1/3` at the bottom — position the bar so the two
  don't overlap (bar spans full width beneath, or CTA and bar share the bottom
  band with explicit spacing). Resolve exact placement against Figma.

---

## 7. Capes exclusion (explicit)

`Capes.astro` is a Pinned Storytelling chapter: only the active/adjacent frame is
visible, media is blurred (`blur(7.5px) scale(1.1)`) as a backdrop, and the "play
head" is the scroll position, driven by `initPinnedStory`. A play/pause button or
scrubber there would fight the scroll scrub and misrepresent the interaction.
Capes stays **Ambient with no controls**; its per-chapter `active` toggling and
visibility pausing are unchanged.

---

## 8. Accessibility

- **Play/pause button:** already a real `<button>` with `aria-pressed` +
  dynamic `aria-label` ("Play video" / "Pause video") and a visible focus ring.
  Keep.
- **Scrubber:** implement as a real, focusable slider —
  `role="slider"` with `aria-label` ("Seek"), `aria-valuemin=0`,
  `aria-valuemax=<duration seconds>`, `aria-valuenow=<currentTime>`, and
  `aria-valuetext` as `m:ss / m:ss`. Keyboard: `←/→` seek ±5s, `Home`/`End` jump
  to start/end, `Space`/`k` toggles play (or is delegated to the button). Update
  ARIA values on `timeupdate`/`seeked`.
- **Focus order:** Presented controls are in the tab order (button, then scrubber);
  Ambient videos are never focusable.
- **Hit target:** the scrubber's interactive/hit area is ≥24px tall even though
  the visible track is 4px (invisible padding), for pointer + touch.
- **Contrast:** played fill vs track must clear WCAG on the resolved surface;
  because colors come from `--control-fg`/`--control-bg` (pure black/white by
  surface luminance, per tokens) this holds on both light and dark media.
- Controls never obscure readable type (motion non-negotiable, design-system §5).

---

## 9. Reduced motion

- Ambient: unchanged — reduced-motion means the video does not autoplay; the poster
  shows. (`updatePlayback` already returns `shouldPlay=false`.)
- Presented: under reduced-motion the video does **not** autoplay; the poster +
  play button + (idle) scrubber are shown so the user can *opt in*. Pressing play
  sets `userIntent='playing'`, which the existing code honors even under
  reduced-motion. Bar/handle grow-transitions are removed under reduced-motion;
  state, color, and focus changes remain (design-system §5 reduced-motion rule).

---

## 10. Files likely touched (when implemented)

- `apps/web/src/components/MediaFrame.astro` — `controls` enum; scrubber DOM +
  styles; extend `MediaFrameElement` with timeline read/seek + slider a11y; keep
  poster + `userIntent` engine.
- `apps/web/src/components/PageHero.astro` — pass `controls="full"` on the media
  hero; ensure the control bar and the headline/CTA overlay don't collide.
- `apps/web/src/components/who-we-are/WhoWeAreFeaturedMedia.astro` — move from
  boolean `controls` to `controls="full"`.
- `apps/web/src/components/case/CaseStudyComposition.astro` — set `full` on a
  full-bleed lead video (Ambient otherwise).
- `apps/web/src/styles/tokens.css` / `motion.css` — only if a token is missing
  (e.g. a scrubber track height var); prefer reusing existing tokens.
- `docs/design-system.md` §2/§5 — add the Presented control bar + scrubber to the
  MediaFrame contract and the Contained-Control motion recipe once built.

No schema changes: profile is a composition decision at the call site, not a CMS
field.

---

## 11. Acceptance criteria

- Every `mux.video` frame paints a poster immediately and never shows a gray box;
  poster is visible whenever the video isn't presenting frames.
- Cards/background videos pause when scrolled out of view, when the tab is hidden,
  and under reduced-motion; they expose no controls and aren't focusable.
- Home hero, Zine hero, and Who We Are featured media show the play/pause button
  **and** a scrubber; play/pause reflects state, and the scrubber tracks
  `currentTime`, shows buffered, and seeks by click/drag/keyboard.
- The scrubber uses system tokens (colors resolve per surface; `--radius-control`;
  motion tokens; PP Tight if any label) and carries no shadow.
- Scrubber is an ARIA slider with correct value/valuetext and keyboard seek;
  focus rings visible; hit target ≥24px.
- Reduced-motion: Presented media doesn't autoplay but can be played via the
  button; no grow/scrub transitions; poster shown.
- Capes is unchanged (no controls; scroll-driven).
- `astro check` clean, vitest green, eslint clean; no new long tasks / layout
  thrash introduced (coordinate with `docs/performance-spec.md`).

---

## 12. Open questions

- **OQ1 — Mute toggle?** Videos are `muted loop` today. Do any Presented heroes
  carry meaningful audio that warrants an unmute control? Default: no.
- **OQ2 — Loop vs play-once on Presented media.** Keep `loop` once a scrubber
  exists, or play once and rest on the last frame / poster? Default: keep loop.
- **OQ3 — Ambient observer threshold.** Keep `threshold: 0` or add a small margin
  so barely-visible cards don't decode? Default: revisit only if it shows in a
  perf trace.
- **OQ4 — Auto-hide the control bar** on inactivity while playing? Default:
  always visible in v1.
- **OQ5 — Exact bar placement vs hero headline/CTA** — confirm against the Figma
  hero composition (SBH-Temp node referenced in `docs/design-system.md`), and
  confirm the reference screenshot's button is the existing `.media-control`.
