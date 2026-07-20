# Case Study Spine implementation specification

**Status:** Ready for implementation  
**Decision source:** [ADR-0017](../adr/0017-case-study-spine.md)  
**Design source:** [signed-off July 2026 Case Study](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-87&m=dev)

## Goal

Replace the flexible Case Study `body[]` with the fixed Case Study Spine: Highlights, Challenge, Unexpected Insight, Big Idea, and Results. Preserve art direction through ordered, standardized media layouts inside the first four sections, while keeping News on its separate flexible Body Block model.

## Scope

This cutover includes:

- the Case Study Sanity model and validation;
- the Tyson seed and a one-time content migration;
- Case Study GROQ projections and generated types;
- the Case Study page composition, section navigation, Press, and Next Project;
- schema contract tests and manual responsive verification;
- retirement of the old Case Study Body Block path and legacy header metadata.

It does not redesign News Body Blocks, cards, `MediaFrame`, the Shared Site Shell, or the underlying Surface Role system.

## Content contract

### Case Study document

Keep the existing index-card fields and replace the Case Study detail fields with this contract:

| Field | Type | Contract |
| --- | --- | --- |
| `title` | string | Required |
| `slug` | slug | Required |
| `client` | string | Required; hero eyebrow |
| `capabilities` | Capability references | Required, unique, 1–6; hero tags |
| `summary` | text | Optional; Work card copy |
| `cardMedia` | `mediaBox` | Existing Work card media |
| `cardAspectRatio` | enum | Existing Work card ratio |
| `tags` | Tag references | Existing Work card tags |
| `cardSize` | enum | Existing Work index composition |
| `leadMedia` | `mediaBox` | Optional 16:9 media immediately after the hero; migrate from `heroMedia` |
| `primaryColor` | hex string | Required |
| `secondaryColor` | hex string | Optional unless Results selects `case-secondary` |
| `highlights` | `caseStudyNarrativeSection` | Required |
| `challenge` | `caseStudyNarrativeSection` | Required |
| `unexpectedInsight` | `caseStudyNarrativeSection` | Required |
| `bigIdea` | `caseStudyNarrativeSection` | Required |
| `results` | `caseStudyResults` | Required |
| `press` | News references | Optional, unique, maximum 3 |
| `nextProject` | Case Study reference | Optional; cannot reference the current document |

Remove `year`, `industry`, `deliverables`, `creativeCollective`, `heroMedia`, and `body`. The signed-off hero contains only client, title, and Capability tags. `heroMedia` becomes `leadMedia` because the media is below the hero rather than its background.

Validate colors against `^#[0-9a-fA-F]{6}$`. A document-level validator must reject `results.surfaceRole === "case-secondary"` without `secondaryColor`.

### Narrative sections

Highlights, Challenge, Unexpected Insight, and Big Idea each contain:

| Field | Type | Contract |
| --- | --- | --- |
| `summary` | Portable Text | Required and non-empty |
| `mediaLayouts` | ordered array | Optional; accepts only the three Case Study media layout objects below |

Narrative sections always use the `light` Surface Role. Do not expose a theme field in Studio. Field identity supplies the fixed label, DOM ID, navigation label, and order, so editors cannot change any of them.

### Case Study media layouts

Use distinct Sanity object types rather than a generic discriminator:

1. `caseStudyFullBleedMedia`
   - one required `mediaBox`;
   - rendered at 16:9 across the content width.
2. `caseStudyTextMedia`
   - one required non-empty Portable Text `text`;
   - one required `mediaBox`;
   - required `mediaPosition`: `left` or `right`.
3. `caseStudyPairedPortraitMedia`
   - exactly two required `mediaBox` entries;
   - rendered as an equal paired portrait composition.

These are Case Study-only types. Keep the existing `mediaSection` and its layouts unchanged for News Body Blocks.

### Results

`caseStudyResults` contains:

- required `surfaceRole`: `case-primary` or `case-secondary`, initially `case-primary`;
- required `stats`, 1–4 entries;
- each stat has required `value` and `label`.

Results has no summary or media-layout array. Tyson uses `case-primary`, matching the signed-off yellow Results surface.

### Press and Next Project

- Press references zero to three News items and renders only when at least one valid reference resolves.
- Next Project references zero or one other Case Study and renders only when it resolves.
- Next Project uses the referenced Case Study's `primaryColor` as its surface background, with readable foreground derived by the existing luminance utility.

## Schema implementation

Add the proposed schema files under `packages/schemas/src/`:

- `caseStudyNarrativeSection.ts`
- `caseStudyFullBleedMedia.ts`
- `caseStudyTextMedia.ts`
- `caseStudyPairedPortraitMedia.ts`
- `caseStudyResults.ts`
- `caseStudyContract.ts`, containing reusable pure validation functions

Register them in `packages/schemas/src/index.ts` and update `caseStudy.ts`.

Use structural fields to make invalid states difficult:

- single-media layouts use one `mediaBox` field, not a one-entry array;
- Next Project is a reference, not an array;
- labels and narrative Surface Roles are absent from authored data;
- cardinality and cross-field rules use shared validators from `caseStudyContract.ts`.

Legacy section schemas remain registered because News still uses them. Rename no News fields or types during this work.

## Query and generated types

Update `apps/web/src/lib/queries.ts`:

- keep `narrativeBodyProjection` exclusively for `newsBySlugQuery`;
- create a Case Study media-layout projection covering all three object types;
- project the five named Spine fields directly;
- project `capabilities[]->{title}`;
- project `leadMedia`;
- resolve Press with the same fields consumed by `NewsCard`;
- resolve Next Project with the same card fields consumed by `WorkCard`, plus `primaryColor`;
- stop projecting the removed metadata and `body`.

Run `pnpm typegen`. Do not hand-edit `apps/studio/schema.json` or `apps/web/src/sanity.types.ts`.

## Component boundary

Add `apps/web/src/components/case/CaseStudyComposition.astro`. It accepts only the generated non-null Case Study query result and owns:

1. brand-color and readable-foreground resolution;
2. the Case Study hero;
3. optional lead media;
4. fixed Spine navigation and active-section behavior;
5. all five Spine sections;
6. optional Press;
7. optional Next Project.

The route continues to own fetching and not-found handling. It composes, without duplicating Case Study logic:

```astro
<Layout>
  <CaseStudyComposition caseStudy={caseStudy}>
    <Navigation slot="navigation" role="surface" />
  </CaseStudyComposition>
  <ContactBand role="brand-deep" />
  <Footer />
</Layout>
```

Add a `surface` role to `Navigation` that inherits `var(--fg)`. The named slot keeps Navigation in the Shared Site Shell while allowing the composition to place it over the hero whose Surface Role determines its foreground.

Proposed Case Study components:

- `CaseStudyHero.astro`
- `CaseStudySpineNav.astro`
- `CaseStudyNarrativeSection.astro`
- `CaseStudyMediaLayout.astro`
- `Results.astro`
- `CaseStudyPress.astro`
- `NextProject.astro`

Prefer existing primitives and adapters:

- use `MediaFrame` for every media item;
- use `SurfaceSection` for surface and foreground contracts;
- use `PortableText` for narrative copy;
- use `NewsCard` for Press;
- adapt or compose `WorkCard`/`EditorialCard` for Next Project rather than building another universal card.

Retire `CaseStudyNarrative.astro`. Replace the Case Study-specific `Outcomes.astro` name with two explicit paths: add `Results.astro` for the fixed Case Study Results contract, and rename the existing generic stats renderer to `NarrativeStats.astro` for the unchanged News `statsSection`. Make `BodyBlockRenderer.astro` News-only, update that renderer import, and remove the Case Study query type from its union. Remove other Case Study-only renderers only after confirming no imports remain.

## Presentation and behavior

Match the signed-off Figma rather than the old route placeholders:

- hero: Primary Brand Color, client eyebrow, title, and wrapping Capability tags;
- no year, industry, Deliverables, or Creative Collective metadata row;
- optional lead media: full-width 16:9;
- Spine navigation: exactly the five fixed labels, in fixed order; Press is not a Spine navigation item;
- section headings, navigation labels, IDs, and order come from one code-owned section definition;
- desktop media layouts preserve the Figma orientation;
- below the project's existing `1024px` breakpoint, text/media and paired portrait layouts stack without horizontal overflow;
- Results displays 1–4 equal stat columns on desktop and a readable wrapping grid on smaller screens;
- Press displays up to three News cards;
- Next Project displays one large Case Study card on the referenced Case Study's Primary Brand Color.

Section navigation must be keyboard operable, expose the active item without relying on color alone, respect reduced-motion preferences, and account for the sticky navigation offset when scrolling. `MediaFrame` continues to own media alt text, loading, and visibility-aware video playback.

## Migration

Add `apps/studio/migrations/migrate-case-study-spine.ts`. The migration must be safe to rerun:

1. fetch Case Studies with legacy fields;
2. map legacy hero detail fields to the new contract;
3. rename `heroMedia` to `leadMedia`;
4. map a Highlights/Brief block to `highlights.summary`;
5. map Challenge to `challenge.summary`;
6. copy Solution into both `unexpectedInsight.summary` and `bigIdea.summary`;
7. map Outcomes stats to `results.stats`;
8. discard legacy Highlights stats, which are not part of the signed-off Spine; Results comes only from legacy Outcomes;
9. set Tyson Results to `case-primary`;
10. preserve existing canonical Capability references; stop rather than translating unmatched Figma tag copy into ad hoc strings;
11. migrate any legacy Case Study media only when its destination section can be determined without guessing; otherwise stop with the document ID and a clear error;
12. remove the legacy detail fields after the replacement fields are populated;
13. delete records whose normalized title or slug identifies Mystery Voyage;
14. fail if more than one Mystery Voyage candidate is found.

The migration must not create empty placeholders for required content. It should abort before mutation when a source Case Study cannot satisfy the new contract. Use a Sanity transaction for the validated patch set.

Update `apps/studio/seed-tyson.ndjson` to the target shape so a fresh dataset does not depend on the migration. Use the signed-off Figma copy and media assignments where they differ from the old seed; the migration-specific rule remains Solution copied into both new narrative fields.

Before running against a shared dataset, export a backup. After migration, query all Case Studies and verify the five Spine fields, colors, Press cardinality, Next Project cardinality, and absence of Mystery Voyage and legacy `body`.

## Schema contract tests

Add Vitest to `@superbloom/schemas` and a `test` script. Contract tests must cover:

- all five Spine fields are required and contain required section content;
- Primary Brand Color is required and both colors accept only six-digit hex;
- Secondary Brand Color is required exactly when Results selects `case-secondary`;
- Results accepts 1–4 complete stats;
- Press accepts at most three unique News references;
- Next Project is a single reference and rejects self-reference;
- full-bleed and text/media layouts contain exactly one media item by construction;
- text/media requires text and media position;
- paired portrait requires exactly two media items;
- Case Study media layouts are not added to News `body[]`;
- fixed labels and order are represented once in the web composition.

Test the pure functions in `caseStudyContract.ts` directly and assert the schema fields use those functions. Do not add rendered-component or visual-regression tests; ADR-0017 explicitly excludes rendered composition as an automated test surface.

## Implementation sequence

1. Add schema contract tests and the target schema types.
2. Update the Case Study document schema and schema registry.
3. Update the Tyson target seed and write the idempotent migration.
4. Update GROQ and regenerate schema/types.
5. Build the Case Study composition and named sections against generated types.
6. Update the route to compose the Shared Site Shell around the Case Study composition, then remove its old presentation logic.
7. Make the News renderer News-only and remove obsolete Case Study components.
8. Run automated validators.
9. Run desktop and mobile QA against the signed-off Figma.
10. Back up and migrate the intended Sanity dataset, then run migration verification.

## Acceptance criteria

- Studio cannot publish a Case Study missing any required Spine content or required color.
- Editors cannot reorder, rename, retheme, or omit Spine sections.
- Editors can order only the three approved media layouts inside the first four sections.
- Tyson renders in the signed-off five-section order with yellow Results.
- The hero contains client, title, and 1–6 Capability tags, with no legacy metadata row.
- The sticky Spine navigation contains exactly five labels and tracks the active section.
- Press renders zero to three referenced News cards and never duplicated coverage fields.
- Next Project renders zero or one non-self Case Study using its Primary Brand Color.
- News continues to render its existing flexible Body Blocks.
- Mystery Voyage and legacy Case Study `body` data are absent after migration.
- No component supplies a raw Superbloom hue where a Surface Role is required.
- Desktop and mobile presentation match the signed-off Figma with no overflow, inaccessible controls, or incorrect media playback.

## Validation

Run from the repository root:

```sh
pnpm --filter @superbloom/schemas test
pnpm typegen
pnpm --filter web astro check
pnpm --filter web build
pnpm --filter studio build
```

Then manually verify Tyson at desktop and mobile widths, including section-nav scrolling, focus states, reduced motion, Press/Next Project conditional rendering, image alternatives, and video pause behavior.
