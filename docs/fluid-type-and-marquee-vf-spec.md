# Fluid Display Type, Fluid Hero Rhythm, and Marquee Variable-Font Morph

Status: **Spec / not implemented.** This document captures the investigated design
and the decisions reached; a later task implements it. No feature code has been
written yet.

Related: `docs/design-system.md` (§Typography, §Spacing, §Motion),
`docs/media-playback-spec.md` (spec convention this mirrors).

---

## 1. Core finding (framing)

"Font interpolation to smoothly change font size on resize" and "variable fonts"
are **two independent mechanisms** that are easy to conflate:

- **Fluid font-size** — pure CSS `clamp()` / `vw`. The browser interpolates natively
  on every resize frame: no JS, SSR-safe, no layout thrash, and **font-agnostic**.
  This is the mechanism that delivers the "smooth on resize" goal.
- **Variable-font axis interpolation** — moving a typeface's design axes
  (width / weight / slant). Requires the VF, causes per-frame glyph re-rasterization
  (a paint, not a compositor-only transform), and is only justified where an axis
  actually moves.

They compose but neither requires the other. You can have fluid size with static
fonts, or VF-axis motion at a fixed size.

### Why the VF is *not* used site-wide

The initial instinct was to adopt the incoming Full Family VF site-wide "to speed
things up and make it smoother." Neither premise holds:

- **Smoothness** comes entirely from CSS `clamp()` and works identically with the
  current static Tight cut. The VF adds nothing to font-size smoothness.
- **Speed** is backwards here: the whole site uses PP Neue Corp at essentially one
  instance — **Tight, Ultrabold**. A single static `PPNeueCorp-TightUltrabold.woff2`
  (shipped today) is *smaller and faster* than a multi-axis width VF. Going site-wide
  would make the render-critical font **heavier**, not lighter, and add CLS/preload
  complexity for zero visual gain.

The VF earns its place **only in the marquee**, where the Width axis genuinely
animates (Condensed → Wide). See §5.

---

## 2. Current state (facts)

- **Type scale** lives in `apps/web/uno.config.ts` as UnoCSS shortcuts with fixed px:
  `type-h1` 200, `type-h2` 140, `type-h3` 120, `type-h4` 80, `type-h5` 56,
  `type-section-heading` 56, plus body/caption/label at 17–19px. Desktop is a flat
  plateau; only a few components add `clamp()` below 1024px, so dragging a desktop
  window changes nothing until it snaps at the 1024 breakpoint.
- **Fonts** (`apps/web/src/styles/fonts.css`, `tokens.css`): static woff2 —
  `PPNeueCorp-TightUltrabold` (display/UI, `--font-display-tight`),
  `PPNeueCorp-CompactUltrabold` (marquee, `--font-marquee`), `Graphik-Medium`
  (body, `--font-body`). All `font-display: swap`.
- **Marquee** (`apps/web/src/components/Marquee.astro`): CSS-keyframe scroll
  (`translateX(-50%)`, seamless because each `.marquee-set` is equal width), font
  `clamp(80px, 13vw, 200px)`. Hover uses a JS Web-Animations hook
  (`updatePlaybackRate`) to slow the scroll to 0.25×. **No GSAP** in this component.
- **Hero** (`apps/web/src/components/PageHero.astro`): `.hero-text` desktop
  `padding: var(--space-3xl /*160*/) var(--page-inset) var(--space-l /*80*/)`;
  `.hero-case` `padding: var(--space-3xl) var(--page-inset) var(--space-m /*64*/)`;
  both switch to bottom-anchored `min-height` + `flex-end` below ~1024/768.
  `SurfaceSection` owns **no** vertical padding, so "header → first content" is the
  hero's bottom padding plus the next section's own top padding.

**PP Neue Corp variable family** (Pangram Pangram, confirmed): three axes — Width
(Compressed→Condensed→Tight→Narrow→Compact→Normal→Wide→Extended), Weight
(Thin→Black), Slant. Sold as 8 width sub-families (each a VF with Weight+Slant) plus
a **Full Family collection VF** that carries the Width axis. The Width axis is only
in the Full Family package (licensed; the team holds it).

---

## 3. Confirmed decisions

1. Fluid scope = **display type only** — `type-h1`/`h2`/`h3`, `type-section-heading`,
   hero H1, marquee. Body/UI/caption/label stay fixed-step (fluid body text fights
   user zoom / min-font-size).
2. Mechanism = **pure CSS `clamp()`**, no JS resize handler.
3. Curve = cap at current **Figma px** reached at **~1440px**, plateau beyond; floor
   at current mobile sizes; continuous between (no 1024 snap, no runaway on ultrawide).
4. VF = **marquee only**; static **Tight Ultrabold stays the site-wide face**
   (untouched). Marquee's static Compact cut is retired for the VF.
5. Marquee morph = **hover / `:focus-within`**; rest **Condensed Ultrabold** → **Wide
   Ultrabold**; **Weight + Slant pinned**, only the Width axis moves; **`--motion-standard`
   (480ms) `ease-out`**; **frozen at Condensed under `prefers-reduced-motion`**.
6. Fluid hero rhythm (continuous, cap at desktop value, plateau past ~1440):
   - Standard text-hero pages (Our Work, Who We Are, News & Press, individual
     article): nav → first header **160px**; last-header → first-section **96px**.
   - Case study: nav → client name **160px**; bottom gap is an **exception**
     (tags/capabilities occupy that region).
   - Home / Zine media heroes **excluded**: text sits **80px** from its container
     edge, then the next section uses the standard **200px** inter-section padding.
7. **Remove dead GSAP imports** across the web app (Marquee uses none).

---

## 4. Workstream 1 — Fluid display type scale

Convert the fixed `text-[Npx]` display shortcuts in `uno.config.ts` to fluid
`clamp()`. Proposed anchors (floor @360px viewport → cap @1440px viewport, linear):

| Step | Current | Proposed clamp |
|---|---|---|
| `type-h1` / hero H1 | 200px | `clamp(64px, 18.7px + 12.59vw, 200px)` |
| `type-h2` | 140px | `clamp(48px, 17.3px + 8.52vw, 140px)` |
| `type-h3` | 120px | `clamp(40px, 13.3px + 7.41vw, 120px)` |
| `type-section-heading` | 56px | `clamp(32px, 24px + 2.22vw, 56px)` |
| Marquee text | `clamp(80px, 13vw, 200px)` | keep (already fluid) |

- Remove PageHero's `@media (max-width:1023px)` H1 font override (the `clamp(64px,
  18vw, 160px)` 160px cap) so H1 is a single continuous curve. Keep the compact-hero
  variant as a distinct token only if a component still needs it.
- `type-h4` (80) / `type-h5` (56) left as fixed steps unless flagged as display in a
  specific context.
- Exact floors/anchors to be finalized against Figma during implementation.
- Font-agnostic: proceeds with the current static Tight cut; unrelated to the VF.

---

## 5. Workstream 2 — Fluid hero vertical rhythm

- Introduce scoped custom properties `--hero-space-top` (cap 160) and
  `--hero-space-bottom` (cap 96), fluid across ~768→1440, plateau past 1440, floored
  at compact values. Apply to `.hero-text` (top + bottom) and `.hero-case` (top only;
  bottom is the tags exception).
  - Illustrative: `--hero-space-top: clamp(96px, 22.9px + 9.52vw, 160px)`;
    `--hero-space-bottom: clamp(56px, 10.3px + 5.95vw, 96px)`. Floors TBD with design.
- Make the **first content section's top padding** on these pages fluid too, so
  header → content reads as one continuous 96px gap. How the 96 is split between hero
  bottom padding and the section top is an implementation detail; the **visible** gap
  must equal 96px at desktop and scale. Likely via a page-composition modifier
  (class / `data-` attribute) on the first section after the hero.
- Keep the existing **bottom-anchored `flex-end`** hero treatment below ~768; fluid
  spacing governs the top-anchored desktop→compact range and hands off to it.
- **Untouched**: the global spacing scale, the 200px inter-section rhythm, and the
  Home / Zine media heroes.

---

## 6. Workstream 3 — Marquee variable-font width morph

- Add an axis-limited collection VF `@font-face` in `fonts.css`: Width axis across
  **Condensed → Wide**, **Weight pinned 750**, **Slant 0**. Repoint `--font-marquee`
  to it (or add `--font-marquee-vf`); retire `PPNeueCorp-CompactUltrabold.woff2` and
  its `@font-face`.
- Register the axis as an animatable custom property so the transition interpolates:

  ```css
  @property --marquee-wdth {
    syntax: '<number>';
    inherits: true;
    initial-value: /* Condensed axis coordinate from the VF fvar */;
  }
  .marquee-text {
    font-family: var(--font-marquee);
    font-variation-settings: 'wdth' var(--marquee-wdth);
  }
  .marquee-track:hover,
  .marquee-track:focus-within {
    --marquee-wdth: /* Wide axis coordinate */;
  }
  .marquee-track { transition: --marquee-wdth var(--motion-standard) var(--motion-ease-out); }

  @media (prefers-reduced-motion: reduce) {
    .marquee-track { transition: none; }
    .marquee-track:hover,
    .marquee-track:focus-within { --marquee-wdth: /* Condensed */; } /* frozen */
  }
  ```

- The existing JS pointer hook keeps handling **only** the scroll-rate slow; the width
  morph is pure CSS and gets keyboard reachability free via `:focus-within`.
- Read the actual Condensed / Wide `wdth` coordinates from the VF's `fvar` table once
  the file lands (do not guess).
- **Seam-math validation**: width animates uniformly across the whole track, so both
  `.marquee-set`s stay equal width and the `translateX(-50%)` wrap holds
  topologically. Validate there is no tear or positional jump during the hover morph
  (the changing intrinsic width could shift apparent scroll position mid-transition);
  the 480ms transition is short, so a small shift is likely acceptable — confirm on
  real hardware.

### Delivery

- The marquee VF is below the fold (Who We Are only) → keep `font-display: swap`, **no
  site-wide preload**. Subsetting / axis-limiting (fonttools: drop Cyrillic + unused
  glyphs, pin weight, restrict width range) is a nice-to-have, not critical.

---

## 7. Cleanup

- Grep the web app for GSAP imports and remove any now-dead ones (the Marquee itself
  uses none; confirm nothing else imports GSAP purely for retired code paths).

---

## 8. Non-goals

- Implementing the feature (this task produces the spec only).
- Site-wide VF adoption (rejected — see §1).
- Fluid body / UI / caption / label type.
- Changes to the Home / Zine heroes, the global spacing scale, or the 200px
  inter-section rhythm.

---

## 9. Follow-ups (when implemented)

- Update `docs/design-system.md` (Typography + Spacing) and `apps/web/src/styles/tokens.css`
  to reflect the fluid tokens.
- Consider an ADR recording the fluid display scale + the "VF for the marquee only"
  decision.

## 10. Validation checklist (for the implementation task)

- Resize sweep 360→1920px: no snaps on H1–H3 / hero / hero spacing; plateau past ~1440.
- `prefers-reduced-motion`: marquee width frozen at Condensed, no per-frame repaint.
- Marquee seam intact through the full hover morph.
- Font-swap CLS check on the marquee.
- `pnpm` lint + build pass; `apps/web/src/components/Marquee.test.ts` passes.
