# CSS Standardization — Fluid Type, Fluid Spacing, Breakpoints

Status: **Implemented** (`feat/css-standardization`; ADR-0024). Awaiting the
human visual QA pass from §7 (resize sweep + Figma check at 360 / 768 / 1024 /
1440); fluid floors remain QA-tunable per §6.

Related: `docs/design-system.md` (§Typography, §Spacing, §Layout and responsive
ranges), `docs/marquee-variable-font-morph-spec.md` (the split-out marquee VF
follow-up), `apps/web/src/styles/tokens.css`, `apps/web/uno.config.ts`.

---

## 0. Goal

Unify and standardize the web app's CSS so the site reads as one designed system
across the full range of breakpoints, rather than a collection of components each
inventing its own type sizes, spacing, and breakpoints. Three axes:

1. **Fluid display type** on one shared ramp, defined once, referenced everywhere.
2. **Fluid vertical rhythm** for large spacing, on one shared curve.
3. **Canonical breakpoints** with a single source of truth.

Scope is deliberately **type + spacing + breakpoints in one spec** (confirmed). The
marquee variable-font width morph is **split out** to
`docs/marquee-variable-font-morph-spec.md`.

### Framing: fluid size vs variable fonts

"Smooth-on-resize" type is pure CSS `clamp()`/`vw` — the browser interpolates
natively, SSR-safe, font-agnostic. It is unrelated to variable-font axis
interpolation (moving width/weight/slant), which only earns its place in the
marquee (see the marquee spec). Everything in *this* document is `clamp()`-based
and works with the current static Tight cut.

---

## 1. Current state (facts)

- **Type scale** lives in `apps/web/uno.config.ts` as UnoCSS shortcuts with fixed
  px (`type-h1` 200 … `type-h5` 56, `type-section-heading` 56, body/caption/label
  17–19). Desktop is a flat plateau; only a few components add `clamp()` below
  1024, so the desktop range doesn't move until it snaps at 1024.
- **Type sizes never entered the token layer.** Color is token-driven in
  `tokens.css` and *referenced* by Uno (`bg: 'var(--bg)'`); spacing is defined in
  `tokens.css` but Uno *re-hardcodes* the literals (`'m': '64px'`); type skips
  `tokens.css` entirely and inlines `text-[200px]` in the shortcut. Type is the
  most divorced axis of the three.
- **~11 components hand-roll their own `clamp()` font-sizes** with slopes from
  3.9vw to 18vw (marquee 13vw, hero H1 18vw, kicker 3.9vw, FactCard 9.7vw, Zine
  8.5vw, Results 13vw, NextProject 10vw, ContactBand 6vw, HomeParallax 7vw,
  Navigation 13vw). Divergent slopes are the primary cause of the inconsistent
  feel across breakpoints.
- **Spacing** scale (`--space-*`) is `8/12/24/32/40/64/80/96/120/160/200`, but is
  bypassed by off-scale raw px: `16` (nav, marquee/carousel mobile, product grid),
  `18–19` (nav), `56` (Issue gap), `72` (case scroll-offset), `240` (Issue padding
  cap), plus control-internal `4/6/10` (tags, buttons, dropdown, spine-nav).
- **Breakpoints** have no shared definition. `design-system.md` declares Small
  `<768` / Compact `768–1023` / Desktop `≥1024`, but ~20 components use
  `max-width: 767px` and ~12 use `768px` (an off-by-one at exactly 768px);
  carousels add `959`/`599`; cart uses `600`.
- **GSAP** is genuinely used (Faq, `src/lib/motion/*`, the prototype). Not dead.

---

## 2. Confirmed decisions (session)

1. Target architecture is **one shared ramp primitive** that all display type
   derives from, with a small set of **documented exceptions** (mostly B, a bit
   of C).
2. Ramp model = **shared anchor viewports, per-step px range** (model "i"): every
   display step starts and stops scaling at the same viewports; each keeps its own
   floor-px and cap-px. Not a single global scale factor.
3. Anchor viewports for **type** = floor **@360px** → cap **@1440px**, plateau past
   1440, single continuous curve (removes the 1024 snap). Desktop-window dragging
   now visibly resizes type (accepted).
4. **Consolidate to canonical steps** (A): snap oddball caps to the nearest shared
   size; verify each via **human QA**, not Figma MCP.
5. Source of truth = **CSS custom properties in `tokens.css`** (A). Uno shortcuts
   and scoped component CSS both reference `var(--type-*)`. Broader goal is CSS
   unification of type **and** spacing (etc.), not type alone.
6. Type/spacing/breakpoints ship in **one spec (C)**; author (Pete) QAs.
7. Spacing goes **fluid (B)** for large vertical rhythm; one-off adjustments handled
   later if disliked.
8. Breakpoints standardize on **768 / 1024** (plumbing/mechanism left to
   implementation).
9. Marquee width-morph is **split** to its own follow-up spec.
10. A **pre-build confirmation gate** (the item table in §6) is baked in: no code
    until each item is signed off; anything flagged during QA is re-confirmed.

---

## 3. Workstream 1 — Fluid display type

### 3.1 Mechanism

- Define each fluid step **once as a CSS custom property in `tokens.css`**, e.g.
  `--type-h1: clamp(…)`. `uno.config.ts` shortcuts set `font-size: var(--type-h1)`;
  scoped-CSS components use the same `var(--type-h2)`. One definition, both worlds;
  no component can hand-roll a `vw` coefficient.
- Generate all clamps from one helper (a small function producing
  `clamp(floor, A + B·vw, cap)` from `(floorPx, capPx)` and the fixed 360/1440
  anchors) so every step shares the identical curve shape. The helper takes a
  **per-use floor** (used by the marquee's held 80 floor).

Curve math (floor @360 → cap @1440, linear, plateau):
`B(vw) = (cap − floor) / 10.8`, `A(px) = floor − (cap − floor) / 3`.

### 3.2 Fluid steps (PP Neue Corp Tight, uppercase display)

| Token | Cap | Floor | Clamp |
|---|---|---|---|
| `type-h1` / hero H1 | 200 | 64 | `clamp(64px, 18.67px + 12.59vw, 200px)` |
| `type-h2` | 140 | 48 | `clamp(48px, 17.33px + 8.52vw, 140px)` |
| `type-h3` | 120 | 40 | `clamp(40px, 13.33px + 7.41vw, 120px)` |
| `type-h4` | 80 | 40 | `clamp(40px, 26.67px + 3.70vw, 80px)` |
| `type-h5` | 56 | 32 | `clamp(32px, 24px + 2.22vw, 56px)` |
| `type-section-heading` | 56 | 32 | `clamp(32px, 24px + 2.22vw, 56px)` |

Floors are **proposed, QA-tunable** against Figma during implementation.
`type-h5` and `type-section-heading` share the identical clamp (both 32→56).

### 3.3 Fixed steps (unchanged — fluid body/UI fights user zoom)

`type-h7` (32, already at the universal floor — fluid gains nothing), `type-h6`
(24), `type-eyebrow`/`type-label` (17), `type-body` (19), `type-caption` (17),
`editorial-title`.

### 3.4 Component consolidation (confirmed per-item)

Snap-and-fold: each of these drops its bespoke clamp and rides the shared ramp.

| Where | Element | Today (desktop cap) | Becomes | Note |
|---|---|---|---|---|
| `ZineLandingIntro` | mid-page statement `<h2>` | 128 | **`type-h3` (120)** | not the hero; separate mobile clamp removed |
| `HomeParallax` | statement `<h2>` | 104 | **`type-h3` (120)** | sibling of the Zine statement — same size |
| `Navigation` | mobile menu links `.compact-link` | 64 | **`type-section-heading` (56)** | folded in, not an exception |
| `FactCardGrid` | fact value/number | 140 | **`type-h2` (140)** | no desktop size change |
| `case/Results` | stat numbers | 120 | **`type-h3` (120)** | no desktop size change |
| `case/NextProject` | card headline | 120 (fixed) | **`type-h3` (120)** | already 120 desktop; removes 1024 snap |
| `ContactBand` | band headline | 56 | **`type-section-heading` (56)** | no desktop size change |
| `PageHero` compact variant | `headingSize="h3"` | 120 | **`type-h3` (120)** | no desktop size change |
| `PageHero` kicker | super-header ("Issue No. 5") | 56 (32→56) | **`type-section-heading` (56)** | matches ramp exactly, no change |

- **Home + Zine heroes:** already share `PageHero` in media mode → `type-h1`.
  Remove PageHero's `@media (max-width:1023px)` H1 override (`clamp(64px, 18vw,
  160px)`) so the H1 is one continuous curve; both heroes behave identically.
- **Marquee (exception on font, standard on size):** rides the shared ramp with
  **cap 200, floor held at 80** → `clamp(80px, 40px + 11.11vw, 200px)`. Its
  *font* stays the marquee face; the width-morph is the split-out spec.

---

## 4. Workstream 2 — Fluid vertical rhythm + spacing cleanup

### 4.1 Fluid spacing (confirmed)

Fluidize **only the top three tokens** (near-pure section rhythm). Curve anchors at
**768 → 1440** (below 768 sits at the floor; distinct from type's 360). Everything
`96` and below stays fixed (component/medium spacing, gaps, control padding —
fluidizing them fights touch targets and readability).

Curve math (floor @768 → cap @1440): `B(vw) = (cap − floor) / 6.72`,
`A(px) = floor − (cap − floor) · 1.142857`.

| Token | Cap | Floor | Clamp |
|---|---|---|---|
| `--space-4xl` | 200 | 120 | `clamp(120px, 28.57px + 11.90vw, 200px)` |
| `--space-3xl` | 160 | 96 | `clamp(96px, 22.86px + 9.52vw, 160px)` |
| `--space-2xl` | 120 | 80 | `clamp(80px, 34.29px + 5.95vw, 120px)` |

- The **200px inter-section rhythm** becomes "120 on mobile → 200 at 1440,"
  smoothly.
- **Hero rhythm falls out automatically:** the hero top uses `--space-3xl`, so it
  now fluidly goes 96→160 with no separate mechanism. There is no longer a distinct
  "hero rhythm workstream."
- One-off spacing that reads wrong after fluidization is tuned later (accepted).

### 4.2 Off-scale spacing cleanup (confirmed)

- **Add `16px` as a real token** (the scale jumps 12→24; 16 is used widely). Snap
  `18–19 → 16`.
- **Snap the rest:** `56 → 64`, `240 → 200`.
- **`72px` case scroll-offset is not spacing** — it's a sticky-nav offset; it
  references nav height, not a spacing token (retoken separately, leave value).
- **Add a control-padding sub-scale** for the below-8px control internals
  (`4/6/10`) rather than fattening tags/buttons by snapping to 8/12. (Exact token
  names, e.g. a `--pad-*` set, finalized in implementation.)
- **Uno reconciliation:** `theme.spacing` references the `--space-*` tokens instead
  of re-hardcoding the literals, matching how `theme.colors` already works.

---

## 5. Workstream 3 — Canonical breakpoints

- **Primary:** `768` and `1024` (matching `design-system.md`: Small `<768`,
  Compact `768–1023`, Desktop `≥1024`).
- **Carousel secondaries:** `600` and `960`. Snap `599 → 600`, `959 → 960`.
- **Fix the 767-vs-768 bug:** standardize every boundary on **`max-width` with
  `.98`** (`767.98`, `1023.98`), preserving the codebase's desktop-first cascade
  (do *not* flip to mobile-first — too large a rewrite for solo QA). Existing
  `min-width: 1024` queries stay; they are the exact complement of
  `max-width: 1023.98`.
- **Single source:** add `postcss-custom-media` so scoped CSS writes
  `@media (--bp-desktop)` from one definition (media queries can't read `var()`).
  Uno `theme.screens` uses the same numbers for any markup breakpoint variants.

---

## 6. Pre-build confirmation gate (baked-in process)

**Implementation does not begin until every item below is signed off.** This table
is the sign-off record from the grilling session; any value flagged during visual
QA is re-confirmed here before the corresponding code is written.

| # | Item | Decision | Status |
|---|---|---|---|
| 1 | Zine mid-page statement 128 | → `type-h3` (120) | ✅ confirmed |
| 2 | HomeParallax statement 104 | → `type-h3` (120) | ✅ confirmed |
| 3 | Mobile nav menu links 64 | → `type-section-heading` (56) | ✅ confirmed |
| 4 | FactCard / Results / NextProject / ContactBand / compact hero | → canonical steps, no desktop change | ✅ confirmed |
| 5 | Marquee | shared ramp, cap 200, **floor 80** | ✅ confirmed |
| 6 | Hero kicker (32→56) | → `type-section-heading` | ✅ confirmed |
| 7 | Home + Zine heroes | stay shared `type-h1`; `<1024` override removed | ✅ confirmed |
| 8 | Fluid steps | h1/h2/h3/h4/h5/section-heading fluid; h7 fixed | ✅ confirmed |
| 9 | Fixed steps | eyebrow/label/body/caption/editorial/h6/h7 | ✅ confirmed |
| 10 | Fluid spacing | 2xl/3xl/4xl fluid, floors 80/96/120, 768→1440 | ✅ confirmed |
| 11 | Off-scale spacing | add 16 + control sub-scale; snap 18–19→16, 56→64, 240→200; 72 = nav offset | ✅ confirmed |
| 12 | Breakpoints | 768 / 1024 primary, 600 / 960 carousel; `max-width .98`; custom-media | ✅ confirmed |
| 13 | Marquee VF morph | split to its own spec | ✅ confirmed |
| 14 | GSAP | genuinely used; only verify nothing dead, no removal | ✅ confirmed |

Floors for the fluid type steps (§3.2) and the exact control-padding token names
(§4.2) remain **QA-tunable against Figma**; confirm during implementation before
finalizing.

---

## 7. Validation checklist (implementation task)

- Resize sweep **360 → 1920**: no snaps on any fluid heading or on 2xl/3xl/4xl
  spacing; type plateaus past 1440; spacing plateaus past 1440 and floors below 768.
- No layout disagreement at exactly **768px** or **1024px** after the breakpoint
  fix.
- Human QA against Figma at 360 / 768 / 1024 / 1440.
- Confirm no component still hand-rolls a `vw` font-size (grep for `vw` in
  `*.astro` returns only intentional exceptions).
- `pnpm` lint + build pass; existing component tests pass.

---

## 8. Non-goals

- Marquee variable-font width morph (own spec).
- Flipping the cascade to mobile-first.
- Fluid body / UI / caption / label / editorial type.
- Fluidizing spacing tokens `96` and below.
- Rewriting Uno type shortcuts into plain CSS classes (rejected — keeps the Uno
  composition pattern used site-wide).

---

## 9. Follow-ups

- **Marquee variable-font width morph** — `docs/marquee-variable-font-morph-spec.md`.
- **ADR** recording the fluid display scale, fluid rhythm, and the
  "tokens.css is the single source; Uno references it" reconciliation (including
  the spacing-literal duplication fix).
- Update `docs/design-system.md` (Typography, Spacing, Responsive ranges) to reflect
  the fluid tokens and canonical breakpoints once implemented.
