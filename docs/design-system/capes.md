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

The current Homepage screen establishes a media-backed Capes composition. Its
motion annotation is not yet approved precedent, so static reading order and
reduced-motion safety are required until the dedicated prototype session.

Implementation backlog to bring `Capes.astro` in line:

- **Description field:** render a per-capability description (maps to
  `capability.subtitle`); the current component does not render `subtitle`.
- **Headline:** maps to `capability.title`.
- **Up to 6:** display cap; `capesBlock.capabilities` only enforces `min(1)`.
- `capesBlock.headline` (section headline) is not present in this grid layout.
