# Work Index

**Status:** Target contract, not an implementation-status claim

**Route:** `/work`

**Current design authority:** [Figma nodes 1:4790 and 1:4816](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4816&m=dev)

**Complete contract:** [CMS Content Composition implementation specification](./cms-content-composition-spec.md)

The Our Work page is the browse page for published Case Studies.

## Fixed structure

1. **Featured** is optional and hidden when empty. Editors manually order 1-4
   unique Case Studies. Every card fully configures width, media aspect ratio,
   and Info position. Featured always uses masonry and has no list defaults.
2. **All** is required. It is a live row-flow list of all published Case Studies
   except those in Featured. Editors set one list default for card width, media
   aspect ratio, and Info position, then may apply partial per-item overrides.
   Items cannot be pinned, manually excluded, or manually ranked.

All sorts by required Case Study publication date, newest by default or oldest.
There is no Tag source filter on Work.

## Cards and loading

Case Studies use the Content Card contract through a Case Study-specific adapter.
Cards show 0-2 Tags in the media-frame top-left and never show a Type badge.
Publication date drives sorting but is not displayed on Case Study cards.

The first All page is server-rendered. A real Load More pagination link is the
no-JavaScript baseline, with endless scrolling as progressive enhancement.
Batch size is frontend-owned and not configurable in the CMS.

On mobile, row and masonry cards become full width and left/right Info positions
revert to Info below.
