# Capes

> A grid of capability headlines, each paired with a short supporting description.

- **Figma:** [node 6062-1284](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6062-1284&m=dev)
- **Maps to:** `apps/web/src/components/blocks/Capes.astro` · schema: `capesBlock`
  (+ `capability`) · used by `homepage.sections[]`

## Description

A set of capabilities, each shown as a headline with a short description, laid out in
a grid (3 columns on desktop, 2 on mobile).

## Fields

- Capability (up to 6)
  - Headline*
  - Description

_Fields marked with an asterisk are required._

## Behavior

- Inherits page color mode (light / dark) via `--fg` / `--bg`.

### Responsive

- **Desktop (1440):** 3-column grid; headline `H5` 56px, description `P1` 17px.
  Page margin 32px, gutter 24px.
- **Mobile (375):** 2-column grid; headline `H5` 32px, description `P1` 16px.
  Page margin 12px, gutter 12px.

## Implementation status / gaps

**Decided: the Figma static grid is canonical.** Capes is the static text grid
documented above (capability headline + description, up to 6, 3-up desktop / 2-up
mobile) — there is **one** Capes, not a Home/About split. The current `Capes.astro`
scroll-pinned video stack (GSAP `ScrollTrigger` pin + crossfading `mux-player`
backgrounds, capability titles as an active-stepped list) **diverges and must be
updated** to match this grid.

Implementation backlog to bring `Capes.astro` in line:

- **Replace the video-pin treatment** with the static 3/2-column grid.
- **Description field:** render a per-capability description (maps to
  `capability.subtitle`); the current component does not render `subtitle`.
- **Headline:** maps to `capability.title`.
- **Up to 6:** display cap; `capesBlock.capabilities` only enforces `min(1)`.
- `capesBlock.headline` (section headline) is not present in this grid layout.
