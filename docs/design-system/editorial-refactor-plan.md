# Editorial refactor implementation plan

## Purpose

Implement the editorial component architecture defined by
[the design language](./design-language.md) and ADRs
[0014](../adr/0014-semantic-surface-roles.md),
[0015](../adr/0015-figma-first-evidence-and-motion-reset.md), and
[0016](../adr/0016-compositional-design-system-boundaries.md).

This plan treats current code as implementation inventory, not visual authority.
Figma is the primary visual reference.

## Architectural guardrails

- A **Module** exposes a small **Interface** and keeps its **Implementation**
  private.
- Put **Seams** where behavior actually varies. Do not add hypothetical seams
  for one implementation.
- Favor **Depth**, **Leverage**, and **Locality** over configurable
  mega-components.
- Fixed Composition pages own module order and allowed variants. Editorial
  Composition pages expose only an allowlisted ordered module sequence.
- Do not create a universal section, card, hero, two-column layout, or page
  builder.
- Do not add or preserve motion behavior until the separate prototype required
  by ADR-0015 is approved.

## Implementation sequence

### 1. Foundation and surface contracts

Establish the shared visual contracts before migrating page modules.

**Modules**

- `SurfaceSection`
- `PageGrid`
- semantic type, spacing, radius, border, and frosted-layer tokens

**Work**

1. Replace the stale token names and incomplete spacing scale in
   `apps/web/src/styles/tokens.css`.
2. Update `apps/web/uno.config.ts` so PP Neue Corp Tight is used for all
   compact interface text and TT Bluescreens is removed from general roles.
3. Replace the current hue-oriented `case/Section.astro` contract with
   `SurfaceSection`, accepting only semantic Surface Roles.
4. Migrate Case Study body-block theme values to `light`, `dark`,
   `case-primary`, and `case-secondary`.
5. Keep page-specific role-to-palette mappings in templates, not content
   modules.
6. Add a 12-column `PageGrid` primitive. Named compositions such as
   `EditorialRail`, `MetricGrid`, and `SplitFeature` remain local to their
   named Modules, rather than becoming `PageGrid` variants.

**Interface**

```ts
interface SurfaceSectionProps {
  role: SurfaceRole
  id?: string
}
```

`SurfaceSection` owns resolved surface and foreground CSS variables plus
vertical rhythm. It does not own layout or content meaning.

**Verification**

- Regenerate Sanity types after schema changes.
- Check visual output at desktop, compact, and small breakpoints.
- Confirm that all affected surfaces retain readable foreground colors.

### 2. High-leverage primitives

Build primitives only where repetition has already established a real Seam.

**Modules**

- `MediaFrame`
- `Metric`
- `TagList`
- approved `Button` and `Icon` primitives

**Interfaces**

```ts
interface MediaFrameProps {
  media: Media | null
  ratio: '16:9' | '1:1' | '4:5' | '9:16' | '3:2' | 'natural'
}

interface MetricProps {
  value: string
  label: string
}

interface TagListProps {
  tags: Tag[]
  context: 'inline' | 'overlay'
}
```

`MediaFrame` owns image and Mux dispatch, crop, ratio, controls, and overlay
slots. It does not own links, card metadata, width, or content routing.

`Metric` owns semantic value and label markup only. Outcomes and Highlights own
their layout, borders, density, and grouping.

**Verification**

- Render every approved media ratio with image and Mux assets.
- Verify inline and overlay tag contexts.
- Confirm primitive Modules do not import page-specific Modules.

### 3. Editorial cards and content adapters

Replace the current universal `Card.astro` with a small compositional Module and
content-specific Adapters.

```text
MediaFrame
  └─ EditorialCard
       ├─ WorkCard adapter
       ├─ NewsCard adapter
       └─ later: ArticleCard and RelatedWorkCard adapters
```

**Interfaces**

`EditorialCard` composes a link, a `MediaFrame`, and content slots. It should
not receive a content model, route convention, or grid width. The consuming
`CardGrid` or `CardCarousel` owns placement and width.

`WorkCard` and `NewsCard` are **Adapters**. They translate their Sanity
projections into the `EditorialCard` Interface and own route construction.

**Work**

1. Add `EditorialCard` and split media rendering into `MediaFrame`.
2. Add `WorkCard`; update `NewsCard` to be an Adapter.
3. Update Work index and News carousel consumers.
4. Remove `Card.astro` only after all consumers have migrated.

**Verification**

- Work and News cards retain their respective metadata, tags, aspect ratios,
  and links.
- Card width and layout are controlled by the parent composition.

### 4. Narrative blocks and Article Detail

Keep the current narrative Body Blocks separate:

- `HighlightsSection`
- `TextSection`
- `MediaSection`
- `Outcomes`, replacing the `StatsSection` presentation name

They compose shared primitives but retain separate schema contracts and
art-directed layouts.

**Internal implementation**

Extract the discriminated-union dispatch from `CaseBodyBlock.astro` into an
internal `NarrativeBlockRenderer`.

**External modules**

- `CaseStudyNarrative` composes the renderer and owns anchors plus
  `NarrativeSectionNav`.
- `ArticleDetail` composes article header, lead media, tags, external coverage,
  and the renderer.

This lets News and Case Studies share Body Block rendering without collapsing
their distinct content models into one generic article type.

**Work**

1. Refactor each Body Block to compose `SurfaceSection`, named layout CSS, and
   relevant primitives.
2. Keep `mediaSection` layouts allowlisted and validate their required media
   counts in the Sanity schema.
3. Extract the duplicated GROQ Body Block projection shared by News and Case
   Study queries.
4. Implement `ArticleDetail` and move the News detail template to it.

**Verification**

- All existing Body Block types render with the expected theme and anchor ID.
- Narrative navigation remains normal anchor links without JavaScript.
- News retains lead media, tags, publication date, external links, and body.

### 5. Named page compositions

Build remaining named Modules only after their primitive dependencies exist.

**Modules**

- `FactCardGrid`, distinct from Case Study Outcomes
- `CardCarousel`, CSS scroll-snap first and optional arrow enhancement second
- `NarrativeSectionNav`
- `MediaHero`, `PageHero`, and `CaseHero`
- shared site shell: `Navigation`, `ContactBand`, `Footer`

**Composition policy**

- Case Study and Who We Are remain Fixed Composition. Their templates own order
  and allowed Surface Roles.
- Homepage remains Editorial Composition, with a Sanity `sections[]` allowlist.
  Editors may order allowed Modules but cannot introduce arbitrary layouts or
  select unsupported roles.

**Verification**

- Carousel cards work with keyboard and without JavaScript.
- Compact navigation is accessible and retains normal links as its baseline.
- Contact Band colors are resolved by the consuming page template.

## Schema and deployment sequencing

1. Publish additive schema support and compatible runtime handling.
2. Run content migration for stored Surface Role values.
3. Regenerate Sanity types and update GROQ projections.
4. Deploy the new Modules and migrate consuming templates.
5. Visually validate against Figma, at all three responsive ranges.
6. Remove superseded components after no imports or content dependencies remain.

## Required validation per slice

```sh
pnpm typegen
pnpm --filter web build
```

Also check keyboard navigation, no-JavaScript reading order, reduced-motion
safety, and Figma alignment at desktop, compact, and small layouts.

## Explicit non-goals

- Motion primitives or GSAP behavior
- A Zine Article schema or Index Page implementation
- Generic grid, generic two-column, or generic eyebrow-heading-body Modules
- Form UX redesign
- Image optimization pipeline or Sanity Studio custom UI
