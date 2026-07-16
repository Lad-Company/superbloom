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

- **Desktop (1440):** media left, text block right (~483px) with semantic
  `display-3`, intro `caption`, and a `Button` CTA. Page margin 32px.
- **Mobile (375):** stacks (media, then text). Headline `H3` 48px. Page margin 12px.

## Implementation status / gaps

Entirely unbuilt. Key design-model notes:

- **Surface:** Home-Zine receives a template-approved semantic Surface Role. Its
  palette mapping is owned by the Homepage template, not chosen by editors.
- **Zine promo content type (decided: build it).** No `zine`/`zineIssue` schema
  exists yet; this block needs a source (latest Zine Issue) plus its own homepage
  block type. **Decided: add a Zine content type.**
- **CTA:** use the approved `Button` primitive.
- **Label\*** is a required field here distinct from the `.d1-label` media tag — it is
  the CTA/section label.
