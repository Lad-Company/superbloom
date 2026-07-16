# Superbloom Design Language

## Status and evidence

This is the approved direction for the reusable web system. Evidence precedence is:

1. The supplied Figma screens:
   [Zine](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-500&m=dev),
   [Index](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-600&m=dev),
   [Article Detail](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-652&m=dev),
   [Case Study](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-87&m=dev),
   [Who We Are](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-245&m=dev),
   [Our Work](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-367&m=dev), and
   [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev).
2. Stable decisions recorded in ADRs and `CONTEXT.md`.
3. Current code, as an implementation inventory only.

Do not infer new visual rules from existing code when it contradicts the first two sources. Motion has no current authority and is deliberately deferred to a new prototype session.

## Visual rules

### Color and surfaces

- Components receive semantic Surface Roles, never raw hues.
- A page template maps allowed roles to Superbloom palette tokens. Case Study roles may instead resolve to a client’s Primary or Secondary Brand Color.
- CMS authors choose only template-approved Surface Roles. They never enter raw component colors.
- `light`, `dark`, `case-primary`, `case-secondary`, and page-specific brand roles are surface roles, not component variants.
- The Contact Band receives a template-owned `contact` role, never an editor-selected color. Its approved mappings are Homepage → purple, Our Work → pink, Who We Are → blue, and Index Page → green.
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
- `MetricGrid`, for Outcomes

The responsive system has three ranges:

- **Desktop, ≥1024px**: retain the art-directed grid composition.
- **Compact, 768–1023px**: maintain hierarchy with adjusted spans and fluid type/space tokens.
- **Small, <768px**: stack editorial grids, except intentional browseable carousels.

Use container-aware component rules where possible. Components may not introduce arbitrary breakpoints.

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
- **Editorial Cards**: `EditorialCard` composes a `MediaFrame`; `WorkCard`, `NewsCard`, `ArticleCard`, and Related Work are content adapters.
- **Article Detail**: shared long-form presentation module for Zine, News, and future editorial records. It does not merge their content models.
- **Case Study**: Case Hero, NarrativeSectionNav, narrative Body Blocks, Outcomes, Related Work.
- **FactCardGrid**: the Who We Are facts pattern.
- **Outcomes**: Case Study results pattern. It is distinct from FactCardGrid.
- **CardCarousel**: CSS scroll-snap and keyboard scrolling first, optional arrow enhancement second.

### Composition boundaries

Compose `SurfaceSection` + `PageGrid` + a named module. Do not add a configurable mega-section with optional headline, media, stats, CTA, and form props. Do not duplicate shared-site-shell modules per page.

## Content-model conventions

- **Fixed Composition**: templates own order and allowed variants. Use for art-directed narrative pages such as Who We Are and Case Study.
- **Editorial Composition**: CMS authors order an allowlisted sequence of modules. Use for modular landing pages such as Homepage.
- **Index Page**: the dedicated browse page for long-form editorial content. It lists News (including press coverage), Zine Articles, and future editorial records in one reverse-chronological feed by publication date, never Case Studies.
- **Case Study Media Section**: one media block with allowlisted layout variants and ordered assets. Keep Highlights, Text, and Stats as separate narrative blocks.
- **Media ratios**: 16:9, 1:1, 4:5, 9:16, 3:2, plus `natural` only for Article Detail body media.
- **Tags**: taxonomy is content meaning. Overlay and inline are presentation contexts. Tag documents do not control raw display color.
- **NarrativeSectionNav**: only templates with named, anchorable Body Blocks use it. Render normal anchor links first, then enhance active state.

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
5. One `StatCards` module conflates fact cards and Case Study Outcomes.
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
  conflates FactCardGrid with Outcomes.
- `apps/web/src/components/case/Section.astro` exposes hue-named section values
  instead of template-constrained Surface Roles.
- `packages/schemas/src/mediaSection.ts` needs the approved layout variants and
  media-ratio constraints. `caseStudy.ts` still describes a shared Card projection.
- `packages/schemas/src/tag.ts` still gives editorial taxonomy a raw display-color
  field.

The next implementation phase must replace these contracts deliberately, preserving
the valid Case Study card-media, tag-taxonomy, and ordering decisions in ADR-0012.

## Prioritized implementation plan

1. Run a standalone motion-prototype session. Establish motion behaviors from scratch before preserving, replacing, or extending any existing animation.
2. Establish foundation tokens: semantic type styles, ordered spacing, radii, frosted layer, border treatment, PageGrid, responsive ranges, and surface contracts.
3. Migrate hue-named CMS themes to constrained semantic Surface Roles, including schema, content migration, queries, and scoped CSS resolution.
4. Build primitives: SurfaceSection, PageGrid, MediaFrame, Button, Icon, TagList, form controls, and Metric. Test light, dark, brand, and case surfaces.
5. Replace duplicated shared-site-shell code with Navigation, ContactBand, Footer, and the accessible compact mobile menu.
6. Split the current Card into MediaFrame, EditorialCard, and content adapters. Add controlled media ratios and progressive CardCarousel.
7. Implement named hero modules, FactCardGrid, Outcomes, Article Detail, Case Study Media Section layout variants, and NarrativeSectionNav.
8. Refactor fixed and editorial CMS templates to consume the new module contracts. Preserve the distinction between template-owned and CMS-ordered composition.
9. Validate all desktop, compact, and small layouts against the supplied Figma screens, and validate keyboard access, contrast warnings/overrides, static no-JavaScript content, and reduced-motion behavior.
