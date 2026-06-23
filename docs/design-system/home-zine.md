# Home-Zine

> Editorial block: a media card paired with a headline, intro line, and label, on a fixed brand color.

- **Figma:** [node 6133-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6133-1279&m=dev)
- **Maps to:** unbuilt — no schema or component. A homepage promo for the
  [Zine](../../CONTEXT.md) (`homepage.sections[]`).

## Description

An editorial block — a media card with a headline, intro line, and label — promoting
the Zine on the homepage.

## Fields

- Headline*
- Intro*
- Media* (image or video)
- Label*

_Fields marked with an asterisk are required._

## Behavior

- Assigned a **brand color (Green, `#99a224`)** background — **does not** switch with
  light / dark page mode.

### Responsive

- **Desktop (1440):** media left, text block right (~483px) with headline `H3` 120px,
  intro `P1` 17px, and a `.d1-button` CTA. Page margin 32px.
- **Mobile (375):** stacks (media, then text). Headline `H3` 48px. Page margin 12px.

## Implementation status / gaps

Entirely unbuilt. Key design-model notes:

- **Fixed brand color → named token role (decided).** The `Section` theming model
  (ADR-0010) resolves `theme` to `light` / `dark` / `primary` / `secondary`. Home-Zine
  uses a **fixed green** that is none of these and is not tied to a case study's brand
  colors. **Decided: add a named token/role** (e.g. a `zine` brand color) rather than
  a one-off background, so the green is a first-class token. Recorded as a named
  `zine` role in the `theme` enum (see ADR-0010 amendment,
  `docs/adr/0010-section-theming-scoped-css-vars.md`) — distinct from the
  client-owned `primary`/`secondary` accents.
- **Zine promo content type (decided: build it).** No `zine`/`zineIssue` schema
  exists yet; this block needs a source (latest Zine Issue) plus its own homepage
  block type. **Decided: add a Zine content type.**
- **`.d1-button` → shared component (decided).** The dark pill CTA is promoted to a
  shared component (also used by Text Media 50-50, 2-up, Crosslink).
- **Label\*** is a required field here distinct from the `.d1-label` media tag — it is
  the CTA/section label.
