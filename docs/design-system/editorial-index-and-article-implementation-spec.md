# Editorial Index and Article Detail implementation specification

**Status:** Ready for implementation  
**Decision source:** [ADR-0018](../adr/0018-editorial-article-separate-model.md), [ADR-0011](../adr/0011-news-content-model.md)  
**Design source:** [Index Page](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-600&m=dev), [Article Detail](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-652&m=dev)

## Goal

Implement the Index Page (`/index`) and shared Article Detail presentation for News and Editorial Articles. The Index Page is a reverse-chronological browse page for long-form editorial content, excluding Case Studies and Zine Articles. Article Detail is a shared rendering module for both News (`/news/[slug]`) and Editorial Articles (`/articles/[slug]`), despite their distinct content models.

## Scope

This cutover includes:

- Editorial Article Sanity schema and validation
- Index Page Sanity singleton for featured content curation
- Index Page route with featured section and View All with progressive Load More
- Article Detail shared component accepting News or Editorial Article
- Editorial Article route at `/articles/[slug]`
- Schema contract tests for both models
- Manual responsive verification

It does not redesign `MediaFrame` or the Shared Site Shell. It replaces the legacy News-only body blocks with the shared Article Body Sections; Case Studies remain on the fixed Case Study Spine. It does not implement Zine routes or Shop.

## Content contract

### Editorial Article document

| Field | Type | Contract |
| --- | --- | --- |
| `title` | string | Required |
| `slug` | slug | Required; unique; used in `/articles/[slug]` |
| `publicationDate` | datetime | Required; used for Index sort |
| `overview` | Portable Text | Required; shown on Article Detail and card |
| `body` | ordered array | Required; accepts `articleTextSection` and `articleMediaSection` only |
| `leadMedia` | `mediaBox` | Required; full-width media after the Article hero |
| `cardMedia` | `mediaBox` | Required; Index Page card media |
| `cardAspectRatio` | enum | Required; `16:9`, `1:1`, `4:5`, `3:2` |
| `tags` | Tag references | Optional; max 2; shared taxonomy with News, Case Studies, Zine Articles |
| `relatedItems` | references | Optional; zero or exactly three; accepts News, Editorial Articles, and Zine Articles; excludes current document |

No author or byline fields in MVP; signed designs show none. Editorial Article has no `externalCoverage` field; that remains News-only.

### News document updates

Update the existing `news` schema to align with Editorial Article:

| Field | Type | Contract |
| --- | --- | --- |
| `title` | string | Required |
| `slug` | slug | Required; unique; used in `/news/[slug]` |
| `publicationDate` | datetime | Required; used for Index sort |
| `overview` | Portable Text | Required |
| `body` | ordered array | Optional; accepts `articleTextSection` and `articleMediaSection` only |
| `leadMedia` | `mediaBox` | Required |
| `externalCoverage` | array | Optional; unique `{ outlet, url, isPrimary }` entries |
| `cardDestination` | enum | Required; `internal` or `external`; initially `internal` |
| `cardMedia` | `mediaBox` | Required |
| `cardAspectRatio` | enum | Required; `16:9`, `1:1`, `4:5`, `3:2` |
| `tags` | Tag references | Optional; max 2 |
| `relatedItems` | references | Optional; zero or exactly three; cross-type allowed; excludes current document |

News `body` may be optional (press mention with no internal writeup), but every News item requires a non-empty body, at least one external coverage link, or both. Editorial Article `body` is required and non-empty. Validate that `relatedItems` is empty or exactly three; reject one or two. When `cardDestination` is `external`, require exactly one `externalCoverage` entry with `isPrimary === true`. Otherwise allow zero or one primary entry.

### Article body sections

Both News and Editorial Article use the same ordered body schema:

**articleTextSection**:
- optional `heading`
- required non-empty Portable Text `text`

**articleMediaSection**:
- required `layout`: `full-width`, `editorial-rail`, or `paired`
- layout-specific fields:
  - `full-width`: exactly one required `mediaBox`
  - `editorial-rail`: exactly one required `mediaBox`
  - `paired`: exactly two required `mediaBox` entries

The Article Detail template owns its signed-off dark Surface Role. Body sections do not expose per-block themes. These two body types replace the legacy News use of Case Study-era section objects and remain distinct from the Case Study Spine.

### Index Page singleton

The `indexPage` singleton curates the featured section:

| Field | Type | Contract |
| --- | --- | --- |
| `lead` | reference | Required; News or Editorial Article; shown as large lead card |
| `secondary` | references | Required; exactly three News or Editorial Articles; shown as secondary cards; must be unique and exclude `lead` |

Featured items are excluded from the View All query. A document-level validator rejects duplicates between `lead` and `secondary`.

### Index Page behavior

- **Featured section**: displays `lead` as a large card and `secondary` as three smaller cards
- **View All section**: displays all News + Editorial Articles in reverse-chronological order by `publicationDate`, excluding featured items
- **Sort control**: URL query `?sort=newest` (default) or `?sort=oldest`
- **Progressive Load More**: seven records per batch; baseline works without JavaScript
- **Card destination**: a News card follows `cardDestination`; `internal` uses `/news/[slug]`, while `external` uses the explicitly marked primary coverage URL and opens in a new tab with a text-and-icon indicator; internal detail always remains accessible
- Cards display `title`, `overview` excerpt, `publicationDate`, `tags`, and `cardMedia` at `cardAspectRatio`

The Index Page excludes Zine Articles and Case Studies. Those have separate browse pages.

## Schema implementation

Add schema files under `packages/schemas/src/`:

- `editorialArticle.ts`
- `articleTextSection.ts`
- `articleMediaSection.ts`
- `indexPage.ts`
- `articleContract.ts` containing shared validation functions

Update `news.ts` to align with the new schema contract. Register all types in `packages/schemas/src/index.ts`.

Use structural fields to make invalid states difficult:
- `relatedItems` validation rejects one or two references
- `secondary` must be exactly three and unique
- single-media layouts use one `mediaBox` field, not arrays
- body section discriminators use distinct object types, not a `kind` field

## Query and generated types

Add to `apps/web/src/lib/queries.ts`:

**indexPageQuery**: fetch `indexPage` singleton with `lead` and `secondary` projections including card fields (`title`, `slug`, `overview`, `publicationDate`, `tags`, `cardMedia`, `cardAspectRatio`).

**indexViewAllQuery**: union query fetching all `news` and `editorialArticle` documents in reverse-chronological order, excluding `lead` and `secondary` from `indexPage`. Accept `sort` parameter (`newest` or `oldest`). Project card fields only. Support pagination offset/limit.

**articleBySlugQuery**: accept `type` (`news` or `editorialArticle`) and `slug`. Fetch full document including `title`, `slug`, `publicationDate`, `overview`, `leadMedia`, `body[]`, `tags`, `externalCoverage` (News only), `relatedItems` with card fields. Project body sections with all layout-specific fields.

Run `pnpm typegen`. Do not hand-edit `apps/studio/schema.json` or `apps/web/src/sanity.types.ts`.

## Component boundary

Add `apps/web/src/components/editorial/ArticleDetail.astro`. It accepts a discriminated union of News or Editorial Article query result and owns:

1. Article hero with `title` and lead media
2. Overview section
3. Ordered body sections via `ArticleBodyRenderer`
4. Optional external coverage (News only)
5. Optional related items (zero or three cards)

The route continues to own fetching and not-found handling. It composes:

```astro
<Layout>
  <Navigation slot="navigation" role="surface" />
  <ArticleDetail article={article} />
  <ContactBand role="brand-deep" />
  <Footer />
</Layout>
```

Proposed components:
- `ArticleDetail.astro`
- `ArticleHero.astro`
- `ArticleBodyRenderer.astro` (replaces `BodyBlockRenderer.astro` name for clarity)
- `ArticleTextSection.astro`
- `ArticleMediaSection.astro`
- `ExternalCoverage.astro` (News only)
- `RelatedItems.astro`

Index Page route at `apps/web/src/pages/index/index.astro`:
- Fetches `indexPageQuery` and `indexViewAllQuery`
- Renders featured section with `lead` + `secondary` cards
- Renders View All with sort toggle and Load More
- Uses existing `NewsCard` and new `EditorialArticleCard` adapters

Editorial Article route at `apps/web/src/pages/articles/[slug].astro`:
- Fetches by slug
- Renders `ArticleDetail`
- Returns 404 if not found

Update existing News route at `apps/web/src/pages/news/[slug].astro` to use `ArticleDetail`.

## Card destination logic

News card link resolution (in `NewsCard` adapter):

```ts
if (news.cardDestination === 'internal') {
  destination = `/news/${news.slug}`
  opensInNewTab = false
}
else {
  destination = news.externalCoverage.find((link) => link.isPrimary).url
  opensInNewTab = true
}
```

Always render a visually subtle "Read more" or internal-detail link even when card links to external coverage, so the internal detail page remains discoverable.

Editorial Article cards always link to `/articles/[slug]`.

## Presentation and behavior

Match the signed-off Figma:

- Index Page featured section: large lead card + three secondary cards in grid
- View All: reverse-chronological card grid with sort toggle (`newest` / `oldest`)
- Progressive Load More: seven records per batch; works without JS via pagination query params
- Article Detail: hero, lead media, overview, body sections, optional external coverage, optional related items
- Article body sections: text sections use readable editorial column; media sections use full-width or text/media layouts
- Desktop media layouts preserve Figma orientation; below `1024px` breakpoint, text/media and paired portrait stack
- Tags displayed as pills using existing `TagList` component
- Related items displayed as three cards using content-appropriate adapters

Section navigation is not required for Article Detail (unlike Case Study Spine). Body sections use shallow hierarchy without fixed nav.

## Accessibility and baseline requirements

- All cards keyboard-operable with visible focus
- External links indicate new-tab behavior without relying on icon alone
- Load More works without JavaScript via pagination query params
- `MediaFrame` owns media alt text, loading, and visibility-aware video playback
- Publication dates on Index cards use semantic `<time>` elements; Article Detail does not add unsigned-off date or byline UI
- Related items section announced as navigation landmark
- Sort control keyboard-operable

## Implementation sequence

1. Add schema contract tests and article body section types
2. Add Editorial Article schema and Index Page singleton
3. Update News schema to align with Editorial Article
4. Update GROQ queries and regenerate types
5. Build ArticleDetail component and article body renderers
6. Build Index Page route with featured + View All + Load More
7. Add Editorial Article route
8. Update News route to use ArticleDetail
9. Update card adapters for News and Editorial Article
10. Run automated validators
11. Run desktop and mobile QA against signed-off Figma

## Acceptance criteria

- Studio cannot publish Editorial Article without required body
- Studio validates `relatedItems` as empty or exactly three
- Index Page featured section excludes duplicates
- Index Page View All excludes featured items
- Sort toggle changes order between newest/oldest
- Load More loads seven records per batch
- News card links to external URL when appropriate, with new-tab indicator
- Studio rejects an external News card destination unless exactly one coverage link is primary
- Editorial Article cards always link to internal detail
- Article Detail renders both News and Editorial Article correctly
- External coverage section renders only for News
- Related items render zero or three cards, never one or two
- Desktop and mobile presentation match signed-off Figma
- All interactions work without JavaScript for baseline experience

## Validation

Run from the repository root:

```sh
pnpm --filter @superbloom/schemas test
pnpm typegen
pnpm --filter web astro check
pnpm --filter web build
pnpm --filter studio build
```

Then manually verify Index Page and Article Detail at desktop and mobile widths, including featured curation, sort toggle, Load More, card destinations, external link indicators, related items, focus states, and reduced motion.
