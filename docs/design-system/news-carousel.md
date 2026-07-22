# Card Carousel

> A horizontally browseable, type-specific list of News Content Cards.

**Status:** Target contract; current code may still use legacy latest-item logic

**Earlier Figma evidence:** [News Carousel, node 6242:1308](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6242-1308&m=dev)

**Current composition authority:** [Figma nodes 1:4790 and 1:4816](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4790&m=dev)

**Complete contract:** [CMS Content Composition implementation specification](./cms-content-composition-spec.md)

## Description

A browseable carousel of News cards using the News-specific Content Card
adapter. It remains a non-Featured list, so it owns one list default for card
width, media aspect ratio, and Info position. Individual entries may apply
partial overrides. Settings resolve through:

`per-item override > list default > content default > global default`

The adapter provides title, overview, publication date, card media, tags, and
validated internal or external News destination. Because this is a type-specific
News list, cards hide the Type badge and show up to two Tags in the media-frame
top-left. Selection and ordering belong to the consuming composition. No item is
implicitly featured because it is the latest by publication date.

## Behavior

- Uses CSS scroll-snap and keyboard scrolling first; arrows are optional
  enhancement.
- Motion is deferred to the dedicated prototype session.
- Carousel cards are the explicit responsive exception to ordinary Content Card
  behavior: they remain narrow on mobile, while Info always moves below media.
- Media ratios use the global list: `intrinsic`, `1:1`, `4:5`, `9:16`, `3:2`,
  `16:9`, and `2:1`.

### Responsive

- **Desktop (1440):** cards in a horizontal row; first card larger (451px) then
  335px cards. Headline `H7` 24px. Left page margin 32px, gutter 24px.
- **Mobile (375):** narrower cards (first 280px, then 200px); headline `H7` 20px;
  page margin 12px, gutter 12px.

## Implementation status / gaps

`NewsCarousel.astro` and its homepage data source may still reflect the earlier
latest-item and binary sizing prop model. That is implementation inventory, not the
target contract. The implementation should move to list defaults, partial
per-item overrides, and the News adapter behavior above.

- **Motion:** do not infer auto-scroll or hover behavior from this tracer. It is
  pending the dedicated motion prototype.
- **Card boundary:** News uses a `NewsCard` content adapter. Work uses a separate
  `WorkCard`; both satisfy the Content Card composition and reuse `MediaFrame`.
- **Responsive sizing** (the documented 451/335px desktop and 280/200px mobile card
  widths, gutters, and `H7` headline steps) is approximated, not pixel-matched.
