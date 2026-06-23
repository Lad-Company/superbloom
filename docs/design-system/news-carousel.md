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

Entirely unbuilt. Notable design-model gaps:

- **No News content type (decided: build it).** `CONTEXT.md` defines **News** (press
  + editorial, distinct from the Zine), but there is no `news` schema and
  `homepage.sections[]` only accepts `heroBlock`, `capesBlock`, `contactBlock`.
  **Decided: add a News document type** plus a homepage carousel block.
- **News Card** is shared with All Work but here shows headline only (no description
  paragraph). Worth extracting a single News Card component with a `copy` toggle.
- **Tags = dedicated field (decided).** Tags use the `.d1-label` translucent pill;
  **decided: a dedicated `tags` field** is their source (not reused
  `capabilities`/`deliverables`), shared with All Work.
- **Auto-scroll + pause-on-hover** behavior is unimplemented (GSAP is available per
  ADR-0007).
