# News Card

> A media card linking to a news item.

- **Figma:** [node 6243-1308](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6243-1308&m=dev) (documented as "News Carousel — Elements")
- **Maps to:** no dedicated component yet; the shared card used by
  [News Carousel](./news-carousel.md) and [All Work](./all-work.md).

## Description

A media card linking to a news item: media with overlaid tags, a headline, and
(optionally) a one-line description.

## Usage

- Use inside the News Carousel.
- Size each card Large or Small as needed.

## Functionality

- Size: **Large** or **Small** (chosen per card).
- Media ratio: `1:1` / `16:9` / `4:5`.
- Tags (up to 2) overlay the media (the `.d1-label` translucent pill).
- States: **default** / **inset** (inset pads the headline/copy block; default is flush).
- Copy toggle: headline only, or headline + description line.

## Implementation status / gaps

Built as `NewsCard.astro`, with props for `size` (large/small) and a `showCopy`
toggle. Media renders an image or Mux video at the item's `aspectRatio`
(`1:1`/`16:9`/`4:5`); tags overlay the media as `.d1-label` pills sourced from the
`tag` taxonomy (referenced by `news.tags`, max 2). The card always links to the
News detail page (`/news/[slug]`).

Deferred backlog (this pass was a tracer):

- **`inset` state** is not implemented — only the default (flush) layout exists.
- **Shared with All Work:** currently used only by the News Carousel. When All Work
  is built, extract the shared card and promote the `.d1-label` styles (scoped here
  for now) to a shared component.
- **Card size source:** `size` is a component prop set by the carousel
  (newest = large, rest = small). The authored/layout-derived fallback described in
  [All Work](./all-work.md) is a Work-index concern, not built here.
