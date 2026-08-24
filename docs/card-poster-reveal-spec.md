# Card Poster Reveal Spec — curated poster that slides away to reveal video

Status: proposed (spec only, no implementation). Sibling to
`docs/media-playback-spec.md` (playback contract) and `docs/design-system.md` §5
(motion). This spec owns the "poster art direction" work that
`media-playback-spec.md` §Non-goals deferred, scoped to content cards.

## Goal

Let editors attach a curated **Poster Image** to a video card. A poster card is
**dormant** — the video does not load or play — until the visitor interacts
(hover, keyboard focus, or tap). On interaction the poster **slides up and away**
(480ms, `--motion-standard`) to reveal the video, which starts playing. On
mouse-leave/blur the poster slides back and the video pauses.

Applies to **every content card surface site-wide** (work grid, `HomeWork`,
`ArticleCard`, `MixedArticleCard`, `ZineArticleCard`,
carousels/rails — anything rendering `EditorialCard` → `MediaFrame`), built once
in `MediaFrame` + `EditorialCard` so all surfaces inherit it.

## Non-goals

- **Implementation.** This pass is spec only.
- **Agent browser QA and agent screenshots.** Verification is human QA only,
  against the acceptance criteria in §8.
- **Capes and `PointerFollowMedia`.** Capes is scroll-driven Pinned
  Storytelling (blurred backdrop chapters, excluded from interactive video per
  `media-playback-spec.md` §7); pointer-follow media is decorative. Neither gets
  posters or reveal behavior.
- **Presented media** (heroes, Who We Are featured, case study lead). Poster
  gating is a card behavior; Presented frames keep their control bar contract.
- **Changing the no-poster behavior.** Video cards without a poster keep
  today's Ambient autoplay (see §2.3). No universal gating, no content
  migration.
- Native `mux-player` chrome, audio design, new easing/duration tokens.

## Requirements (from the brief)

- Implementation happens in a **git worktree** per `docs/agents/worktrees.md`
  (own `pnpm install`, own `.env.local`, probe the Vite dep cache before
  handing a dev server to a human).
- **Human QA only** — no agent-driven browser testing or screenshot capture.

---

## 1. Current state (confirmed in code)

- **CMS** — `packages/schemas/src/mediaBox.ts`: the shared `mediaBox` object
  holds `asset` (array, exactly 1 item: `mux.video` **or** `image`), `altText`,
  `decorative`. There is no way to pair an image with a video.
- **Projection** — one shared fragment, `mediaProjection` in
  `apps/web/src/lib/queries.ts`, projects `asset[0]` (image crop/hotspot/dims,
  or video `playbackId`/`aspectRatio`), `altText`, `decorative`. Every card
  query uses it.
- **Poster today** — for a `mux.video` asset, `MediaFrame` paints a real
  `<img>` (`https://image.mux.com/<id>/thumbnail.jpg?time=0`) *under* the
  `<mux-player>` and fades it out on `data-video-ready` (`playing`/`canplay`).
  The still is auto-generated; editors have no control over it.
- **Playback today** — `MediaFrameElement.updatePlayback()`: plays when
  `active && isVisible && documentVisible && !reducedMotion`; an explicit
  control interaction sets a sticky `userIntent` that survives reduced-motion.
  Cards are Ambient: muted loop, `preload="none"`, no controls, not focusable.
- **Cards** — `EditorialCard` is a single `<a>` wrapping `MediaFrame` plus text
  content; the whole card is the link. `WorkCard`, `ArticleCard`, etc. compose it.

**Gap:** a video card always autoplays on visibility, and its only still is the
un-curated Mux `time=0` frame. Editors cannot art-direct what a video card
looks like at rest.

---

## 2. CMS schema delta

### 2.1 `mediaBox` gains an optional `poster` field

In `packages/schemas/src/mediaBox.ts`:

- `name: 'poster'`, title **"Poster Image"**, `type: 'image'`, with the same
  hotspot config and ratio previews (9:16, 1:1, 2:1) as the main image asset.
- **Visible and valid only when `asset[0]` is a `mux.video`:**
  - `hidden: ({parent}) => parent?.asset?.[0]?._type !== 'mux.video'`
  - Validation: error if a poster is set on an image asset (defensive; the
    `hidden` rule is the primary guard).
- Description (editor-facing UX copy, draft):
  > Optional still shown over the video until a visitor hovers or taps the
  > card, where it slides away to reveal the video. Leave empty to autoplay
  > the video whenever the card is on screen.
- **Alt text:** the poster reuses the mediaBox's existing `altText` — one
  media unit, one alt. No new alt field. (In card context the link's
  accessible name comes from the card title; the poster conveys the same
  content as the video it covers.)

### 2.2 Projection + types

- Extend `mediaProjection` in `apps/web/src/lib/queries.ts` with a `poster`
  sub-projection mirroring the image branch (`asset`, `crop`, `hotspot`,
  `width`, `height`, `mimeType`). One fragment, so every card surface picks it
  up automatically.
- Regenerate Sanity types (`apps/web/src/sanity.types.ts`).
- Extend the `Media` interface in `MediaFrame.astro`:
  `poster?: ImageProjection | null`.

### 2.3 Semantics: opt-in per card

| `poster` on a video asset | Card behavior |
|---|---|
| **set** | **Gated**: dormant until interaction; curated poster slides away to reveal video (this spec) |
| **unset** | **Ambient**: today's behavior, unchanged — muted autoplay loop while visible, Mux `time=0` thumbnail until ready |

The feature rolls out editorially, card by card. Nothing changes for existing
content on ship; no migration. Grids may legitimately mix gated (still until
hovered) and ambient (always moving) cards — that mix is the editor's choice.

---

## 3. Playback model: a third state, "Gated Ambient"

`media-playback-spec.md` defines Ambient and Presented profiles. This adds a
gated variant of Ambient for poster cards. It is **not** a new `controls`
value — no control DOM is involved — it is a playback gate.

- A gated frame renders the curated poster as a real `<img>` **above** the
  `<mux-player>` and the Mux thumbnail layer, absolute `inset: 0`,
  `object-fit: cover`, honoring hotspot/crop, using the card's `sizes`
  (`cardImageSizes`). It sits **below** the overlay slot (e.g. card tags).
- **Dormant until revealed:** the gate ANDs a `revealed` condition into
  `updatePlayback()` — a gated frame plays only when
  `revealed && active && isVisible && documentVisible && !reducedMotion`
  (plus the existing `userIntent` override). With `preload="none"` and no
  `play()` call, Mux fetches no segments before first reveal; a poster card is
  strictly cheaper than today's ambient card.
- **Reveal** (hover/focus/tap, §4): set `revealed`, call `play()`. The slide
  lands on the **existing Mux `time=0` thumbnail layer** — never a gray box —
  and the video fades in when ready via the existing `data-video-ready` path.
  The first reveal per card therefore reads as still → motion a beat later;
  that is intentional loading, not jank.
- **Conceal** (mouse-leave/blur): clear `revealed`, pause. The video stays
  loaded, so subsequent reveals are instant (dormant-but-warm).
- The `active` attribute contract (Capes chapter toggling) is unaffected;
  gated cards simply never carry `active` semantics of their own.

---

## 4. Interaction contract

The whole card is one `<a>`, so wiring lives in `EditorialCard` (the link),
which toggles a `revealed` attribute on its `media-frame` element — the same
pattern Capes uses for `active` (`observedAttributes`). `MediaFrameElement`
observes `revealed`, drives the poster transform (§5) and `updatePlayback()`.

- **Desktop hover** — `pointerenter` on the card reveals; `pointerleave`
  conceals.
- **Keyboard** — `focusin`/`focusout` on the card link reveal/conceal, so
  keyboard users get the same affordance as hover. No new focusable elements;
  the card remains a single tab stop.
- **Touch** (no hover) — **first tap reveals** (the card's click handler calls
  `preventDefault` when gated and not yet revealed; detect touch via
  `pointer: coarse` / pointer type), **second tap navigates**. A
  `pointerdown` anywhere outside the card conceals. A revealed-then-concealed
  card requires one tap to re-reveal before navigation, same as the first.
- **Scroll-away** — a revealed card that scrolls out of view pauses via the
  existing visibility gate; its poster stays revealed (no re-cover churn while
  scrolling).

---

## 5. Motion recipe — "Poster Slide"

A new named recipe under the Content Card family in `docs/design-system.md`
§5, composed from existing tokens only:

- **Property:** `transform` only. The poster translates `translateY(0)` →
  `translateY(-100%)` (slides up off the top); conceal reverses it. The frame
  must clip (`overflow: clip` on the media frame) so the traveling poster
  never paints outside the card.
- **Timing:** `--motion-standard` (480ms — slowed from `--motion-quick` after
  visual QA; the reveal reads as a curtain lift, not a snap),
  `--motion-ease-out` (`cubic-bezier(0.22,0.8,0.2,1)`), same duration/easing in
  both directions. No stagger, no opacity fade, no delay.
- **Direction rationale:** upward reads as lifting a curtain and rhymes with
  the Type Reveal's upward rise. Direction is systemic, never per-card.
- The video's own ready-fade (`data-video-ready`, `--motion-standard`) is
  unchanged and composes underneath the slide.
- **Reduced motion:** the slide transition is removed; the poster state change
  is preserved as an instant swap (design-system §5: state changes survive,
  motion does not).

---

## 6. Accessibility & reduced motion

- **No new tab stops, no new controls.** The card stays one link with its
  existing accessible name; the video remains non-focusable Ambient media.
- **Keyboard parity:** focus reveals exactly as hover does (§4), so the
  poster never hides content from keyboard users.
- **Reduced motion:**
  - Slide animation off; poster swaps instantly (state change preserved).
  - Hover/focus reveal does **not** start playback — `updatePlayback` already
    blocks autoplay under reduced-motion, so the reveal shows the still
    thumbnail. This matches today's reduced-motion ambient contract.
  - An explicit **tap** counts as user intent: set `userIntent = 'playing'`
    on touch reveal, which the existing engine honors even under
    reduced-motion (same rule as the Presented play button).
- **Alt text:** the poster `<img>` uses the mediaBox `altText` (or empty alt
  when `decorative`); it is removed from the accessibility tree when revealed
  (`aria-hidden` toggled with the reveal state) so its duplicate semantics
  don't linger once the video is showing.

---

## 7. Files likely touched (when implemented)

- `packages/schemas/src/mediaBox.ts` — `poster` field, hidden/validation,
  hotspot previews, editor copy.
- `apps/web/src/lib/queries.ts` — `poster` sub-projection in
  `mediaProjection`.
- `apps/web/src/sanity.types.ts` — regenerated types.
- `apps/web/src/components/MediaFrame.astro` — `Media.poster`; poster overlay
  `<img>` (above player/thumbnail, below overlay slot); `revealed` in
  `observedAttributes`; gate in `updatePlayback()`; poster transform +
  `aria-hidden` on reveal; `overflow: clip` check.
- `apps/web/src/components/EditorialCard.astro` — hover/focus/tap wiring that
  toggles `revealed` on its `media-frame`; first-tap `preventDefault` on
  touch; outside-`pointerdown` conceal.
- `docs/design-system.md` §5 — add the Poster Slide recipe to the Content Card
  family.
- `docs/media-playback-spec.md` — cross-reference: its §Non-goals "poster art
  direction" deferral is now owned here; add Gated Ambient to the profile
  table.
- `CONTEXT.md` — glossary entry for **Poster Image** if the term sticks in
  editorial conversation.

No new dependencies. No new motion tokens. GSAP is not required — a CSS
transition on an attribute-driven class is sufficient and preferred (the slide
is a state change, not a timeline).

---

## 8. Acceptance criteria (human QA)

Studio:

- Poster Image field appears on media only when the asset is a video; never on
  an image asset. Hotspot pin works with the three ratio previews.
- Validation error if a poster is somehow stored on an image asset.
- Publishing a video card with no poster behaves exactly as before (ambient
  autoplay).

Site (desktop):

- A poster card is still at rest: no video motion, and the Network panel shows
  no Mux segment requests before the first interaction.
- Hover slides the poster up off the card in ~480ms; the revealed frame shows
  the video's still immediately (no gray box) and starts playing shortly
  after. Mouse-leave slides the poster back and the video pauses. Re-hover is
  instant (no reload stutter).
- Keyboard: tabbing to the card reveals it; tabbing away conceals it. The card
  remains a single tab stop; Enter navigates.
- Poster respects its hotspot crop at every card aspect ratio.
- A grid mixing poster and non-poster video cards renders both correctly:
  gated cards still, ambient cards moving.

Site (touch):

- First tap on a poster card reveals + plays; second tap navigates. Tapping
  elsewhere conceals.
- Scrolling a revealed card out of view pauses it; the poster stays revealed.

Reduced motion (OS setting):

- Poster swap is instant (no slide). Hover/focus reveal shows the still but
  does not play the video. Tap reveal plays it.

General:

- `astro check`, `vitest`, and eslint clean.
- No new long tasks or layout thrash (coordinate with
  `docs/performance-spec.md`); verify with a quick Performance trace on a
  card-heavy page.

---

## 9. Open questions

- **OQ1 — Hover-intent damping.** Raw `pointerenter` fires on every drive-by
  cursor crossing a grid. Ship without damping (240ms slide is cheap and
  reversible); add intent detection only if human QA finds it twitchy.
- **OQ2 — Conceal timing.** Pause immediately on conceal (spec default) vs.
  let the video finish a beat under the returning poster. Default: immediate.
- **OQ3 — Touch re-reveal after navigation back.** Back/forward cache may
  restore a card in its revealed state. Acceptable; the outside-tap and
  scroll gates keep behavior sane. Verify in human QA.
- **OQ4 — Presented surfaces with posters.** If a hero ever wants a curated
  poster + click-to-reveal, that is a separate composition decision; this
  spec's gate is card-scoped.
