# Marquee Variable-Font Width Morph

Status: **Spec / not implemented, blocked on the font file.** Captures the design
and decisions; implementation waits until the collection variable font is in hand
(the axis coordinates must be read from the file, not guessed).

Related: `docs/css-standardization-spec.md` (owns the marquee's *size* behavior and
the site-wide fluid type/spacing/breakpoint work — this spec owns only the *font*
and the width morph), `docs/design-system.md` (§Typography, §Motion),
`apps/web/src/components/Marquee.astro`, `apps/web/src/styles/fonts.css`,
`apps/web/src/styles/tokens.css`.

> **Split note.** This spec was extracted from the former
> `fluid-type-and-marquee-vf-spec.md`. The fluid display type, fluid vertical
> rhythm, and breakpoint standardization moved to
> `docs/css-standardization-spec.md`. The marquee's *sizing* (shared ramp, cap 200,
> floor held at 80) is decided there; this document changes only the marquee's
> font family and its hover/focus width animation.

---

## 1. Framing: fluid size vs variable fonts

These are two independent mechanisms, easy to conflate:

- **Fluid font-size** — pure CSS `clamp()`/`vw`. Native per-frame interpolation on
  resize, SSR-safe, font-agnostic. This delivers "smooth on resize" and is handled
  entirely by the CSS standardization spec (the marquee already gets it there).
- **Variable-font axis interpolation** — moving a typeface's design axes
  (width/weight/slant). Requires the VF, causes per-frame glyph re-rasterization (a
  paint, not a compositor-only transform), and is only justified where an axis
  actually moves.

They compose but neither requires the other.

### Why the VF is *not* used site-wide

The instinct to adopt the incoming Full Family VF site-wide "to speed things up and
make it smoother" does not hold:

- **Smoothness** comes entirely from CSS `clamp()` and works identically with the
  current static Tight cut. The VF adds nothing to font-size smoothness.
- **Speed** is backwards: the site uses PP Neue Corp at essentially one instance —
  Tight, Ultrabold. A single static `PPNeueCorp-TightUltrabold.woff2` (shipped
  today) is smaller and faster than a multi-axis width VF. Going site-wide makes the
  render-critical font heavier and adds CLS/preload complexity for zero gain.

The VF earns its place **only in the marquee**, where the Width axis genuinely
animates (Condensed → Wide).

---

## 2. Current state (facts)

- **Marquee** (`apps/web/src/components/Marquee.astro`): CSS-keyframe scroll
  (`translateX(-50%)`, seamless because each `.marquee-set` is equal width). Hover
  uses a JS Web-Animations hook (`updatePlaybackRate`) to slow the scroll to 0.25×.
  **No GSAP** in this component. Font currently `--font-marquee`
  (`PPNeueCorp-CompactUltrabold`, static). Size is being moved to the shared fluid
  ramp (cap 200, floor 80) by the CSS standardization spec.
- **Fonts** (`fonts.css`, `tokens.css`): static woff2 — `PPNeueCorp-TightUltrabold`
  (`--font-display-tight`), `PPNeueCorp-CompactUltrabold` (`--font-marquee`),
  `Graphik-Medium` (`--font-body`). All `font-display: swap`.
- **PP Neue Corp variable family** (Pangram Pangram, confirmed): three axes — Width
  (Compressed→Condensed→Tight→Narrow→Compact→Normal→Wide→Extended), Weight
  (Thin→Black), Slant. Sold as 8 width sub-families plus a **Full Family collection
  VF** that carries the Width axis (licensed; the team holds it).

---

## 3. Confirmed decisions

1. VF = **marquee only**; static **Tight Ultrabold stays the site-wide face**
   (untouched). The marquee's static Compact cut is retired for the VF.
2. Marquee morph = on **hover / `:focus-within`**; rest state **Condensed
   Ultrabold** → **Wide Ultrabold**; **Weight + Slant pinned**, only the Width axis
   moves; **`--motion-standard` (480ms) `ease-out`**; **frozen at Condensed under
   `prefers-reduced-motion`**.
3. Split out of the CSS standardization work; implemented when the font lands.

---

## 4. Workstream — Marquee variable-font width morph

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

- The existing JS pointer hook keeps handling **only** the scroll-rate slow; the
  width morph is pure CSS and gets keyboard reachability free via `:focus-within`.
- Read the actual Condensed / Wide `wdth` coordinates from the VF's `fvar` table
  once the file lands (do not guess).
- **Seam-math validation:** width animates uniformly across the whole track, so both
  `.marquee-set`s stay equal width and the `translateX(-50%)` wrap holds
  topologically. Validate there is no tear or positional jump during the hover morph
  (the changing intrinsic width could shift apparent scroll position mid-transition);
  the 480ms transition is short, so a small shift is likely acceptable — confirm on
  real hardware.

### Delivery

- The marquee VF is below the fold (Who We Are only) → keep `font-display: swap`,
  **no site-wide preload**. Subsetting / axis-limiting (fonttools: drop Cyrillic +
  unused glyphs, pin weight, restrict width range) is a nice-to-have, not critical.

---

## 5. Cleanup

- GSAP is genuinely used elsewhere (Faq, `src/lib/motion/*`, the prototype); the
  Marquee itself imports none. No GSAP removal is in scope beyond confirming nothing
  imports it purely for a retired marquee code path.

---

## 6. Non-goals

- Site-wide VF adoption (rejected — see §1).
- The marquee's font-size behavior (owned by `docs/css-standardization-spec.md`).
- Fluid type / spacing / breakpoint standardization (owned by the same spec).

---

## 7. Validation checklist (implementation task)

- `prefers-reduced-motion`: marquee width frozen at Condensed, no per-frame repaint.
- Marquee seam intact through the full hover/focus morph (no tear or jump).
- Font-swap CLS check on the marquee.
- Keyboard: `:focus-within` triggers the morph without a pointer.
- `pnpm` lint + build pass; `apps/web/src/components/Marquee.test.ts` passes.

---

## 8. Follow-ups (when implemented)

- Update `docs/design-system.md` (§Typography note on the marquee's alternate face).
- Consider an ADR recording the "VF for the marquee only" decision.
