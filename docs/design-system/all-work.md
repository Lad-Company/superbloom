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

**Built** against the R3 design
([node 4394-2448](https://www.figma.com/design/PgQyJQIoLqIfoWnJtU0MTh/-i--Superbloom---R3?node-id=4394-2448&m=dev)),
which supersedes the older "large/small alternation" model with **per-card
aspect ratio + rows of one full-width or two equal-width cards**. See ADR 0012.

- **Page:** `work/index.astro` is a dark `Section` with an H1 hero + "All Work"
  grid, reusing `ContactBlock` + `Footer`. Hero/heading copy comes from the
  `workIndex` singleton (fallbacks hardcoded). The **featured carousel** above
  the grid is deferred.
- **Card:** shared `Card.astro` (media + tag overlay + headline + summary),
  consumed by both the Work grid (`size="fill"`) and News (`NewsCard` delegates).
- **Schema (`caseStudy`):** added `cardMedia` (mux.video|image, max 1),
  `cardAspectRatio` (`1:1`/`16:9`/`4:5`/`2:1`), `tags` (ref→`tag`, max 2),
  `cardSize` (`full`/`half`, default `half`), and `orderRank`
  (`@sanity/orderable-document-list`). `summary` reused. `title` → headline.
- **Row layout:** cards are packed in `orderRank` order — a `full` card takes its
  own row; consecutive `half` cards pair two-per-row; single column on mobile.
- **Min 5 work items:** a page-level display rule, not a schema constraint.
