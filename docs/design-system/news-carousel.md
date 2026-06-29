# News Carousel

> An auto-scrolling horizontal carousel of news items.

- **Figma:** [node 6242-1308](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6242-1308&m=dev)
- **Maps to:** unbuilt — no News schema or component yet. Belongs on the homepage
  (`homepage.sections[]`). Shares the News Card with [All Work](./all-work.md).

## Description

An auto-scrolling carousel of news items, each rendered as a News Card (media with
overlaid tags + a headline, no body copy).

## Fields

- News item (min 5)
  - Media* — `1:1` / `16:9` / `4:5`
  - Headline*
  - Tags — up to 2

_Fields marked with an asterisk are required._

## Behavior

- Auto-scrolls horizontally.
- Pauses on hover.

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

- **Auto-scroll + pause-on-hover** motion is not implemented — currently a static,
  horizontally-scrollable row. Build with GSAP (available per ADR-0007).
- **All Work reuse:** the News Card is not yet shared with the All Work grid; the
  `.d1-label` pill styles are scoped inside `NewsCard.astro` and should be promoted
  to a shared component when All Work is built.
- **Responsive sizing** (the documented 451/335px desktop and 280/200px mobile card
  widths, gutters, and `H7` headline steps) is approximated, not pixel-matched.
