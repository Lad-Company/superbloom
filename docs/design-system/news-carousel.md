# Card Carousel

> A progressively enhanced, horizontally browseable collection of editorial cards.

- **Figma:** [node 6242-1308](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6242-1308&m=dev)
- **Maps to:** `CardCarousel` composition for editorial-card collections.

## Description

A browseable carousel of News cards (media with overlaid tags and a headline).

## Fields

- News item (min 5)
  - Media* — `1:1` / `16:9` / `4:5`
  - Headline*
  - Tags — up to 2

_Fields marked with an asterisk are required._

## Behavior

- Uses CSS scroll-snap and keyboard scrolling first; arrows are optional
  enhancement.
- Motion is deferred to the dedicated prototype session.

### Responsive

- **Desktop (1440):** cards in a horizontal row; first card larger (451px) then
  335px cards. Headline `H7` 24px. Left page margin 32px, gutter 24px.
- **Mobile (375):** narrower cards (first 280px, then 200px); headline `H7` 20px;
  page margin 12px, gutter 12px.

## Implementation status / gaps

Built as `NewsCarousel.astro`, driven by a `newsBlock` homepage section that
auto-resolves the latest News by `publishedAt`. The newest item renders as the
large/featured card (with `summary` copy); the rest are small, headline-only. The
`news` document type, the `tag` taxonomy, and the composite News model are recorded
in ADR-0011; CONTEXT.md defines **News** and **Tag**.

Deferred backlog (this pass was a tracer):

- **Motion:** do not infer auto-scroll or hover behavior from this tracer. It is
  pending the dedicated motion prototype.
- **Card boundary:** News uses a `NewsCard` content adapter. Work uses a separate
  `WorkCard`; both compose `EditorialCard` and `MediaFrame`.
- **Responsive sizing** (the documented 451/335px desktop and 280/200px mobile card
  widths, gutters, and `H7` headline steps) is approximated, not pixel-matched.
