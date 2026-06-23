# All Work

> The Work index: an editorial grid of all Case Studies in mixed card layouts.

- **Figma:** [node 6324-1308](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6324-1308&m=dev)
- **Maps to:** `apps/web/src/pages/work/index.astro` · schema: `caseStudy` · route: `/work`

## Description

An editorial grid of all work items in mixed layouts. The page headline reads
"All Work". Below it, Case Studies are laid out in rows that alternate between
two small cards side by side and a single large (full-width) card.

## Fields

Per work item (card):

- Media* — image/video, one of three aspect ratios: `1:1`, `16:9`, `4:5`
- Headline*
- Tags — up to 2 (dedicated `tags` field)
- Card size — `large` / `small` (optional; layout-position-derived when unset)

Page-level:

- Work item — minimum of 5

_Fields marked with an asterisk are required._

## Behavior

- Rows mix large and small cards (a full-width large card alternates with rows of
  two small cards).
- Each card overlays its tags (the `.d1-label` pill) at the top of the media.
- Reflows to a single column on mobile.

### Responsive

- **Desktop (1440):** multi-column grid; small cards sit two per row, large cards
  span full width. Headline at `H3` (~120px). Page margin 32px, gutter 24px.
- **Mobile (375):** single column; all cards stack full width. Headline at `H3`
  mobile (~48px). Page margin 12px.

## Implementation status / gaps

Current `work/index.astro` is a tracer stub (a bare `<ul>` of links). The grid,
cards, and responsive behavior are unbuilt. Schema gaps against `caseStudy`:

- **Card media:** no thumbnail/grid-image field; only `heroVideo` (Mux) exists.
  The 1:1 / 16:9 / 4:5 aspect-ratio variants are not modeled.
- **Tags (up to 2) = dedicated field (decided).** No `tags` field exists today;
  **decided: add a dedicated `tags` field** (not reused `capabilities`/`deliverables`),
  shared with News Card.
- **Card size (large / small) = optionally authored, layout-derived fallback
  (decided).** Card size is an **optional authored field** per work item; when not
  authored, it is **derived from layout position** (the large/small alternation rule).
  This is a Work-index ordering concern, not a `caseStudy` field.
- **Headline:** maps to `caseStudy.title`.
- **Min 5 work items:** a page-level display rule, not a schema constraint.
