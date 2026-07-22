# Index Page

**Status:** Target contract, not an implementation-status claim

**Route:** `/index`

**Current design authority:** [Figma nodes 1:4790 and 1:4816](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4790&m=dev)

**Complete contract:** [CMS Content Composition implementation specification](./cms-content-composition-spec.md)

The Index Page is the mixed Article browse page for published News, Editorial,
and Zine Articles. Case Studies are not included.

## Fixed structure

1. **Featured** is optional and hidden when empty. Editors manually order 1-4
   unique Articles. Every card fully configures width, media aspect ratio, and
   Info position. Featured always uses masonry and has no list defaults.
2. **All** is required. It is a live row-flow list of every matching published
   Article except those in Featured. Editors set one list default for card
   width, media aspect ratio, and Info position, then may apply partial per-item
   overrides. Items cannot be pinned or manually excluded.

All sorts by publication date, newest by default or oldest. The Index singleton
may optionally select one Tag as a CMS source rule. This is not a visitor-facing
filter. With no selected Tag, All includes every published News, Editorial, and
Zine Article not in Featured.

## Cards and loading

Index cards use the Content Card contract. Mixed lists show a required Type
badge plus at most one Tag in the media-frame top-left. Article publication date
is visible in the adapter-owned Info block. News may use an internal or validated
primary external destination; Editorial and Zine Articles use their type routes.

The first All page is server-rendered. A real Load More pagination link is the
no-JavaScript baseline, with endless scrolling as progressive enhancement.
Batch size is frontend-owned and not configurable in the CMS.

On mobile, row and masonry cards become full width with Info below. Explicit
horizontal carousels are the only narrow-card exception.
