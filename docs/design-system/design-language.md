# Superbloom Design Language

## Status and evidence

This is the approved direction for the reusable web system. Evidence precedence is:

1. The current composition authority:
   [CMS Content Composition Figma](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4790&m=dev)
   at nodes 1:4790 and 1:4816, as interpreted by the
   [CMS Content Composition implementation specification](./cms-content-composition-spec.md).
2. The earlier supplied Figma screens, where they do not conflict:
   [Zine](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-500&m=dev),
   [Index](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-600&m=dev),
   [Article Detail](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-652&m=dev),
   [Case Study](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-87&m=dev),
   [Who We Are](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-245&m=dev),
   [Our Work](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-367&m=dev), and
   [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev).
3. Stable decisions recorded in ADRs and `CONTEXT.md`.
4. Current code, as an implementation inventory only.

Do not infer new visual rules from existing code when it contradicts the first two sources. Motion has no current authority and is deliberately deferred to a new prototype session.

## Visual rules

### Color and surfaces

- Components receive semantic Surface Roles, never raw hues.
- A page template maps allowed roles to Superbloom palette tokens. Case Study roles may instead resolve to a client's Primary or Secondary Brand Color.
- CMS authors choose only template-approved Surface Roles. They never enter raw component colors.
- `light`, `dark`, `case-primary`, `case-secondary`, and page-specific brand roles are surface roles, not component variants.
- The Contact Band receives a template-owned `contact` role, never an editor-selected color. Its approved mappings are Homepage → purple, Our Work → pink, Who We Are → blue, Index Page → green.
- Surface foreground selection must report contrast risk, but editors may explicitly override it. Do not silently block publishing.
- No shadows. Hierarchy comes from contrast, full-bleed color bands, crop, border, and frosted overlay treatment.

### Typography

| Style | Typeface | Desktop reference | Purpose |
| --- | --- | ---: | --- |
| `display-1` | PP Neue Corp Tight | 200px | Page and campaign hero |
| `display-2` | PP Neue Corp Tight | 140px | Primary section heading and metric |
| `display-3` | PP Neue Corp Tight | 120px | Section heading |
| `display-4` | PP Neue Corp Tight | 80px | Feature heading |
| `display-5` | PP Neue Corp Tight | 56px | Card, narrative, and smaller heading |
| `editorial-title` | Graphik | 38px / 24px | Article lead and card title |
| `body` | Graphik | 19px | Reading copy |
| `caption` | Graphik | 17px | Supporting copy and metadata |
| `label` | PP Neue Corp Tight | 17px | Buttons, tags, nav, controls |

All styles are semantic responsive tokens, not raw sizes. PP Neue Corp Compact, Condensed, and Wide are not general-purpose roles. Compact is not used. Condensed and Wide are retained exclusively for the Who We Are `MarqueeDisplay` module. TT Bluescreens is not part of this web system.

The July 2026 Figma screens still label some button, CTA, and overlay-label instances with TT Bluescreens. That typography is stale Figma implementation detail, not an exception to this rule. Update the Figma components to PP Neue Corp Tight before treating those annotations as current.

### Space, shape, and layers

The ordered spacing scale is `8, 12, 24, 32, 40, 64, 80, 96, 120, 160, 200px`. Expose it as `space-1` through `space-11`, with `gutter = 24px` and desktop `page-inset = 32px` aliases.

- `radius-control`: 6px
- `radius-field`: 8px
- `border-subtle`: 1px at surface-appropriate low contrast
- `frosted`: translucent surface plus the single shared backdrop-blur recipe

## Layout and responsiveness

`PageGrid` is a 12-column grid with the 24px gutter and 32px desktop inset. Named compositions, not ad hoc widths, express the observed layouts:

- `CardGrid`, for editorial card collections
- `SplitFeature`, for two-column text/media compositions
- `EditorialRail`, for Article Detail and Case Study reading layouts
- `MetricGrid`, for Results

The responsive system has three ranges:

- **Desktop, ≥1024px**: retain the art-directed grid composition.
- **Compact, 768–1023px**: maintain hierarchy with adjusted spans and fluid type/space tokens.
- **Small, <768px**: stack editorial grids, except intentional browseable carousels.

Use container-aware component rules where possible. Components may not introduce arbitrary breakpoints.
For Content Cards and Content Layout Rows, the composition contract takes effect
below 1024px: ordinary cards become full width with Info below, and two-block
detail rows stack full width in authored order. Explicit horizontal carousels
remain narrow on mobile.

## Component taxonomy

### Primitives

| Primitive | Responsibility | Does not own |
| --- | --- | --- |
| `SurfaceSection` | Surface Role, foreground contract, section rhythm | Content layout or content type |
| `PageGrid` | Columns, gutter, inset, responsive spans | Surface or media behavior |
| `MediaFrame` | Ratio, crop, media overlays, controls | Link destination or metadata |
| `Button` | `solid`, `translucent`, `outline`, `icon` variants | Page-specific styling |
| `Icon` | Controlled icon vocabulary and accessible presentation | Accessible name, supplied by its control |
| Form controls | Text field, select, textarea, form action | Submission orchestration |
| `TagList` | `overlay` and `inline` presentation contexts | Raw taxonomy colors |
| `Metric` | A value and its explanatory label | Group layout |

### Modules

- **Shared site shell**: Navigation, ContactBand, Footer.
- **Heroes**: Media Hero, Page Hero, Case Hero. They share primitives but remain named modules.
- **Content Cards**: the shared listing composition uses `MediaFrame`;
  Work, News, Editorial Article, Zine Article, and Next Project remain
  content-specific adapters.
- **Article Detail**: shared long-form presentation module for Zine Articles,
  News, and Editorial Articles. These use one Article model with an internal
  type discriminator, separate Studio views, type routes, and adapter behavior.
- **Case Study**: Case Hero, Case Study Spine (five fixed sections), Press, Next Project.
- **FactCardGrid**: the Who We Are facts pattern.
- **Results**: Case Study Results section pattern. It is distinct from FactCardGrid.
- **CardCarousel**: CSS scroll-snap and keyboard scrolling first, optional arrow enhancement second.

### Composition boundaries

Compose `SurfaceSection` + `PageGrid` + a named module. Do not add a configurable mega-section with optional headline, media, stats, CTA, and form props. Do not duplicate shared-site-shell modules per page.

## Content-model conventions

- **Fixed Composition**: templates own order and allowed variants. Use for art-directed narrative pages such as Who We Are and Case Study.
- **Editorial Composition**: CMS authors order an allowlisted sequence of modules. Use for modular landing pages such as Homepage.
- **Content Card**: listing composition for linked News, Editorial, Zine Article,
  and Case Study cards. It owns card width, media aspect ratio, and Info position.
- **Content Layout Row**: detail-page composition of one or two Media or Text
  blocks. It is used in Article bodies and may support every fixed Case Study
  Spine section without replacing Results stats.
- **Index Page**: the mixed Article browse page at `/index`. It has fixed
  Featured then All sections and includes News, Editorial, and Zine Articles,
  never Case Studies. All sorts by publication date newest or oldest and may be
  narrowed by one CMS-selected Tag source rule.
- **Our Work Page**: the Case Study browse page at `/work`. It has fixed Featured
  then All sections. All is a live date-sorted list with no pins or Tag filter.
- **Case Study Spine**: five required fixed sections (Highlights, Challenge, Unexpected Insight, Big Idea, Results) whose meaning, navigation labels, and order are locked.
- **Article Body**: ordered Content Layout Rows for News, Editorial, and Zine
  Articles. Each row contains one or two Media or Text blocks.
- **Shared fractions**: `1/4`, `1/3`, `1/2`, `2/3`, `3/4`, and `full`.
- **Media ratios**: `intrinsic`, `1:1`, `4:5`, `9:16`, `3:2`, `16:9`, and `2:1`
  in every media context.
- **Card Info position**: `below`, `left`, or `right`. Left/right requires a card
  width of at least `1/2` and reverts to below on mobile.
- **Tags**: taxonomy is content meaning. Overlay and inline are presentation contexts. Tag documents do not control raw display color.
- **Card badges**: all labels appear in the media-frame top-left. Mixed Article
  lists show Type plus at most one Tag. Type-specific lists hide Type and show up
  to two Tags. Case Study cards show up to two Tags and no Type badge.
- **NarrativeSectionNav**: only templates with named, anchorable sections use it (e.g., Case Study Spine). Render normal anchor links first, then enhance active state.

## Interaction rules

- Existing motion implementations are void as design-system precedent.
- A dedicated prototype session must establish motion behavior, timing, easing, and breakpoint treatment before motion primitives are implemented.
- Static reading order and `prefers-reduced-motion` safety remain required.
- Mobile navigation is an accessible compact menu, not wrapped desktop links.
- Carousel content remains reachable without JavaScript.

## Evidence-driven inconsistencies to remove

1. The current hue-named CMS themes conflict with semantic Surface Roles.
2. Current typography relies on missing TT Bluescreens even though PP Tight is now the approved compact interface face.
3. Spacing names are incomplete and raw values recur in components.
4. `Card` combines Media Frame, card layout, content metadata, and width management.
5. One `StatCards` module conflates fact cards and Case Study Results.
6. The mobile navigation is not designed, and current responsive behavior is only ad hoc `768px` stacking.
7. Current GSAP/ScrollTrigger timing and behavior are not approved motion evidence.

## Stale-code inventory

This is an implementation inventory, not authorization to migrate it in place.

- `apps/web/src/styles/tokens.css` and `apps/web/uno.config.ts` encode incomplete
  spacing, R3 naming, hue tokens, PP Compact, and TT Bluescreens.
- `apps/web/src/components/Card.astro` is the void universal-card contract.
  `Button.astro` exposes no approved variants, and `Nav.astro` has no compact-menu
  contract.
- `apps/web/src/components/StatCards.astro` lets content select hue themes and
  conflates FactCardGrid with Results.
- `apps/web/src/components/case/Section.astro` exposes hue-named section values
  instead of template-constrained Surface Roles.
- `packages/schemas/src/mediaSection.ts` needs the approved layout variants and
  media-ratio constraints. `caseStudy.ts` still describes a shared Card projection.
- `packages/schemas/src/tag.ts` still gives editorial taxonomy a raw display-color
  field.

The next implementation phase must replace these contracts deliberately,
preserving valid Case Study card media and Tag taxonomy while replacing legacy
manual ranking with the approved Featured and live All list contracts.

## Prioritized implementation plan

1. Run a standalone motion-prototype session. Establish motion behaviors from scratch before preserving, replacing, or extending any existing animation.
2. Establish foundation tokens: semantic type styles, ordered spacing, radii, frosted layer, border treatment, PageGrid, responsive ranges, and surface contracts.
3. Migrate hue-named CMS themes to constrained semantic Surface Roles, including schema, content migration, queries, and scoped CSS resolution.
4. Build primitives: SurfaceSection, PageGrid, MediaFrame, Button, Icon, TagList, form controls, and Metric. Test light, dark, brand, and case surfaces.
5. Replace duplicated shared-site-shell code with Navigation, ContactBand, Footer, and the accessible compact mobile menu.
6. Split the current Card into MediaFrame, Content Card presentation, and
   content-type adapters. Add the approved settings inheritance and preserve
   CardCarousel as the explicit narrow-mobile exception.
7. Implement named hero modules, FactCardGrid, Results, Article Detail, Content
   Layout Rows, and Case Study Spine navigation.
8. Refactor fixed and editorial CMS templates to consume the new module contracts. Preserve the distinction between template-owned and CMS-ordered composition.
9. Validate all desktop, compact, and small layouts against the supplied Figma screens, and validate keyboard access, contrast warnings/overrides, static no-JavaScript content, and reduced-motion behavior.
