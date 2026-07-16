# 2-up

> Two side-by-side cards that link out.

- **Figma:** [node 6182-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6182-1279&m=dev) (source component named "2-up" / About-2-up)
- **Maps to:** unbuilt — no schema or component. A cross-navigation section, likely
  used on About/landing pages.

## Description

Two side-by-side cards that link out — each a media block with a headline and a
controlled `Button` variant.

## Fields

- Crosslink (×2)*
  - (each: media + headline + CTA label + link)

_Fields marked with an asterisk are required._

## Behavior

- Inherits page color mode (light / dark) via `--fg` / `--bg`.

### Responsive

- **Desktop (1440):** two equal columns side by side. Headline `H5` 56px, square
  (1:1) media. Page margin 32px, gutter 24px.
- **Mobile (375):** stacks to a single column. Headline `H5` 32px. Page margin 24px.

## Implementation status / gaps

Entirely unbuilt.

- **No "crosslink" model.** Each card is a link to another page/section with its own
  media + headline + CTA. No schema represents this; would need a new block type
  (and a home for it, e.g. an About page document or a homepage section).
- **Button:** use the approved `Button` primitive. Variant selection is determined
  by the composed Surface Role, not a legacy CSS class.
- Media supports overlay tags (`.d1-label`) but the documented fields list only the
  two required crosslinks.
