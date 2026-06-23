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

Unbuilt. Recommended as a single reusable component shared by News Carousel and
All Work, with props for size (large/small), media aspect ratio, tags, and a
`copy` / `state` (default vs inset) toggle. Depends on a News content type
(**decided: build it** — see [News Carousel](./news-carousel.md)).

- **Tags = dedicated field (decided).** Source is a dedicated `tags` field, shared
  with All Work (not reused `capabilities`/`deliverables`).
- **Card size = optionally authored, layout-derived fallback (decided).** Size is an
  optional authored field per card; when unset, it is derived from layout position
  (see [All Work](./all-work.md)).
