# CMS Content Composition implementation specification

**Status:** Approved for issue decomposition  
**Design source:** [Figma authority](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4790&m=dev) (nodes 1:4790, 1:4816)  
**Supersedes:** Portions of `editorial-index-and-article-implementation-spec.md`, `zine-implementation-spec.md`, `work-index.md`, and related component-level specs  
**Decision source:** Post-grill confirmation session July 2026

## Goal

Implement a unified compositional system for all Superbloom editorial and work content, establishing clear boundaries between listing compositions (Content Card) and detail-page compositions (Content Layout Row). This specification reconciles conflicting prior documentation and provides a single source of truth for CMS data contracts, layout rules, validation requirements, and rendering behavior.

## Scope

This specification includes:

- Content Card composition for linked editorial/content cards on listing pages (Index Page, Our Work page, homepage carousels, Zine Issue article lists, etc.)
- Content Layout Row composition for detail-page authoring (Article bodies, Case Study Spine sections)
- Index Page and Our Work page structures with Featured and All sections
- Unified Article model with News/Editorial/Zine discriminator and Studio views
- Zine Issue membership as sole source of Zine Article publication authority
- Tag and badge display rules for mixed and type-specific lists
- Progressive enhancement endless scroll with SSR + Load More fallback
- Validation matrix, responsive behavior, migration policy, and acceptance criteria

This specification does not:

- Redesign MediaFrame or Media Asset
- Implement a dedicated Video Library, which is deferred
- Alter Case Study Spine fixed structure (Highlights, Challenge, Unexpected Insight, Big Idea, Results remain unchanged)
- Replace content-specific adapters with a universal content adapter or data model
- Create repeating patterns, pins, or open-ended page builders (removed)
- Add date-based sort options beyond publication date newest/oldest
- Support multi-level tag hierarchies or filtering UI beyond single optional Tag filter

## Non-goals

- Compatibility layers for legacy card models: pre-launch policy allows destructive schema replacement
- Universal content data model: content adapters remain distinct
- Broad migration tooling: narrow cleanup for Zine stale fields only
- Dynamic section ordering in fixed-structure pages (Index, Work, Case Study)
- Advanced filtering UI (multiple tags, date ranges, search): deferred

## Canonical Distinctions

### Content Card vs. Content Layout Row

**Content Card** is a listing/browse composition used for linked editorial/content cards. It controls the card's overall presentation on browse pages (Index, Work, homepage sections, Zine Issue article lists). It applies only to linked editorial/content cards, not to stats, facts, or CTA blocks.

**Content Layout Row** is a detail-page composition used inside Article bodies and Case Study Spine sections. It controls the layout of one or two blocks (Media or Text) within a single row on a detail page.

These two compositions are distinct. Both reuse Media Asset and Media Frame but do not share layout controls. A Content Card may specify an aspect ratio and card width; a Content Layout Row may specify block widths and row alignment. These settings are not interchangeable.

### Content types that use Content Card

- News items (Index Page, homepage News carousel)
- Editorial Articles (Index Page)
- Zine Articles (Zine Issue article lists)
- Case Studies (Our Work page)

### Content types that use Content Layout Row

- Article bodies (News, Editorial Articles, Zine Articles)
- Case Study Spine sections (Highlights, Challenge, Unexpected Insight, Big Idea, Results)

## Data Model

### Content Card settings

Every content type that appears as a Content Card owns three configurable defaults:

| Setting | Values | Default | Scope |
| --- | --- | --- | --- |
| `cardWidth` | `1/4`, `1/3`, `1/2`, `2/3`, `3/4`, `full` | `1/2` | Sizes whole card including media + Info block |
| `mediaAspectRatio` | `intrinsic`, `1:1`, `4:5`, `9:16`, `3:2`, `16:9`, `2:1` | `16:9` | Global list shared across all media |
| `infoPosition` | `below`, `left`, `right` | `below` | Info block position relative to media |

**Card width**: Controls the card's percentage of the container width. On mobile (below 1024px breakpoint), row and masonry cards become full width. Horizontal carousel cards are an explicit narrow-width exception but Info remains below.

**Media aspect ratio**: Global list shared across all media contexts (cards, detail pages, etc.). `intrinsic` preserves the source media's natural dimensions without cropping. All other values crop to the specified ratio.

**Info position**: Controls where the Info block appears relative to the media:
- `below`: Info block stacks below media (default)
- `left`: Info block left of media (internal split layout)
- `right`: Info block right of media (internal split layout)

Left/right positions use a fixed responsive internal split layout. This split is allowed only when Card width is `1/2` or greater. On mobile, left/right cards revert to Info below.

### Content Card Info contents

Info contents are fixed by the content-type adapter and not editable per card. Typical Info contents:

- Title (always)
- Supporting metadata selected by the content-type adapter
- Publication date (Articles only, not Case Studies)
- Tags/badges (see Tag and Badge Rules below)

Tags and badges always appear in the media-frame top-left corner, not in the Info block.

### Content Card defaults hierarchy

**Global default**: Every content type has a global default for the three card settings (ratio, width, Info position). These defaults are `16:9`, `1/2`, `below` unless explicitly configured otherwise.

**Content default**: Each content document (Article, Case Study) stores its own default values for the three settings. These override the global defaults when set.

**List default**: Every non-Featured content list (Index All, Our Work All, homepage News carousel, Zine Issue article list, Past Issues, etc.) defines a list-level default for the three settings. This overrides the content defaults.

**Per-item override**: Each item in a list may partially override specific settings (e.g., only ratio, or only width). These override the list default.

**Featured exception**: Featured sections (Index Featured, Our Work Featured) have no list default. Every Featured card must fully configure all three settings (ratio, width, Info position) explicitly.

**Inheritance for non-Featured lists**:
```
per-item partial override > list default > content default > global default
```

### Index Page structure

The Index Page (`/index`) has two sections:

1. **Featured** (optional, hidden at 0 cards)
   - 1-4 unique cards
   - Manually ordered
   - Each card fully configures ratio, width, Info position
   - Always masonry layout
   - Grid packs columns independently (allows whitespace)
   - Sources: News + Editorial + Zine Articles

2. **All** (required)
   - All published News + Editorial + Zine Articles
   - Excludes Featured cards
   - Row-flow layout (rows place left-to-right, wrap before overflow)
   - One list default + partial per-item overrides
   - Live query (includes all matching published content)
   - Whitespace allowed (warning not blocking)
   - Sort: Publication date newest (default) or oldest
   - Optional one Tag filter (no tag = all)
   - Progressive enhanced endless scroll

Featured is excluded from All. No pins. Membership cannot exclude matching published content.

### Our Work page structure

The Our Work page (`/work`) has two sections:

1. **Featured** (optional, hidden at 0 cards)
   - 1-4 unique Case Studies
   - Manually ordered
   - Each card fully configures ratio, width, Info position
   - Always masonry layout
   - Grid packs columns independently
   - Sources: Case Studies only

2. **All** (required)
   - All published Case Studies
   - Excludes Featured cards
   - Row-flow layout
   - One list default + partial per-item overrides
   - Live query (includes all matching published Case Studies)
   - Whitespace allowed (warning not blocking)
   - Sort: Publication date newest (default) or oldest
   - No Tag filter
   - Progressive enhanced endless scroll

Publication date is required for Case Studies (new requirement). Date is visible on Article cards but not on Case Study cards.

### Unified Article model

All Articles share a single `article` document with a required internal `articleType` discriminator:

| Field | Type | Contract |
| --- | --- | --- |
| `articleType` | enum | Required; `news`, `editorial`, `zine`; sets route and adapter behavior |
| `title` | string | Required |
| `slug` | slug | Required; unique within type |
| `publicationDate` | datetime | Required; used for Index sort and Article cards |
| `overview` | Portable Text | Required; shown on Article Detail and card |
| `body` | ordered array | Required (except News may be optional); Content Layout Rows |
| `leadMedia` | `mediaBox` | Required; full-width media after Article hero |
| `cardMedia` | `mediaBox` | Required; card media |
| `cardWidth` | enum | Required; `1/4`, `1/3`, `1/2`, `2/3`, `3/4`, `full`; content default |
| `mediaAspectRatio` | enum | Required; global list; content default |
| `infoPosition` | enum | Required; `below`, `left`, `right`; content default |
| `tags` | Tag references | Optional; max 2 |
| `relatedItems` | references | Optional; zero or exactly three; cross-type allowed; excludes self |
| `externalCoverage` | array | Optional; News only; `{ outlet, url, isPrimary }` |
| `cardDestination` | enum | Optional; News only; `internal` (default) or `external` |

**Type-specific routes**:
- `news`: `/news/[slug]`
- `editorial`: `/articles/[slug]`
- `zine`: `/zine/issues/[issue-slug]/[article-slug]` (Issue slug required)

**Studio views**: Separate Studio views and create actions for News, Editorial Article, and Zine Article. Each view presets and hides the `articleType` discriminator. This preserves distinct editorial identities while sharing the schema.

**News body**: News `body` may be optional (press mention with no internal writeup), but every News item requires a non-empty body, at least one external coverage link, or both.

**News card destination**: When `cardDestination` is `external`, require exactly one `externalCoverage` entry with `isPrimary === true`. The card links to that URL and opens in a new tab with an indicator. Internal detail always remains accessible.

**Type badge**: Mixed Article lists (Index All) show a required Type badge (`News`, `Editorial`, `Zine`) + max 1 optional Tag (2 labels total). Type-specific lists hide the type badge and show up to 2 Tags.

### Zine Issue as publication authority

Each Zine Issue owns an ordered `articles` array. This array is the sole source of truth for Zine Article membership and order.

| Field | Type | Contract |
| --- | --- | --- |
| `articles` | Article references | Required; ordered; minimum one; must reference `articleType === 'zine'` only |

**Publishing rule**: A Zine Article cannot be published unless exactly one Zine Issue references it in its `articles` array. Validation blocks publication when the Article has zero or multiple Issue references. Issue authoring also warns when a selected Article is already referenced by another Issue. A pre-launch audit verifies the invariant across all published Zine Articles.

**Zine routes**:
- Zine landing: `/zine` (displays current Issue)
- Issue archive: `/zine/issues/[issue-slug]` (redirects to `/zine` if current)
- Zine Article: `/zine/issues/[issue-slug]/[article-slug]`

**Zine stale fields removed**: `coverAspectRatio`, `coverMedia`, `introHeadline`, `introText`, `issueNumber`, `publicationDate` (moved to Article level). `pdfAsset` is supported and not obsolete.

**ISSUU vs. PDF**: Each Zine Issue requires exactly one of:
- `issuuUrl`, titled `ISSUU Flipbook URL` in Studio (embedded)
- `pdfAsset` (renders fixed "Read the Zine" CTA)

Keep ISSUU field label unchanged. Remove top-level mixed Media nav.

**Video Library**: Dedicated Video Library is deferred entirely and must not be described as implemented. Field-level Mux video behavior remains unchanged.

### Content Layout Row (detail-page composition)

Content Layout Row is the shared detail-page authoring module used inside:
- Article bodies (News, Editorial, Zine)
- Case Study Spine sections (Highlights, Challenge, Unexpected Insight, Big Idea, Results)

**Row structure**: 1-2 blocks per row. Each block is either Media or Text.

**Block widths**: Each block has a Media width (for Media blocks) or content width (for Text blocks) from the shared fractions: `1/4`, `1/3`, `1/2`, `2/3`, `3/4`, `full`.

**Two-block constraint**: When a row has two blocks, their combined widths must total `full` (e.g., `1/3` + `2/3`, or `1/2` + `1/2`).

**Single narrow block alignment**: When a row has one block and its width is less than `full`, the row has an alignment setting: `left`, `center`, or `right`.

**Full bleed**: A row with one `full`-width Media block may be marked as full bleed (extends beyond content margins).

**Media block**:
- Uses `mediaBox` asset (image or Mux video selected or uploaded from the field)
- Uses global aspect ratio from the same list as Content Card (`intrinsic`, `1:1`, `4:5`, `9:16`, `3:2`, `16:9`, `2:1`)

**Text block**:
- Optional heading (plain text)
- Required rich text (Portable Text, supporting bold, italic, links, lists)

**Mobile behavior**: Below 1024px, every block becomes full width. Two-block rows stack in authored order. Single-block alignment applies on desktop only.

**Case Study Spine fixed structure**: The five Spine sections (Highlights, Challenge, Unexpected Insight, Big Idea, Results) remain fixed in name, order, and navigation. Every section may use Content Layout Rows. Results also retains its required fixed stats treatment; Content Layout Rows provide supporting narrative or media and do not replace the stats contract.

### Tag and Badge rules

**Tag taxonomy**: Shared across News, Editorial Articles, Zine Articles, and Case Studies. Tags are distinct from Capabilities (service offerings) and Deliverables (work outputs).

**Max tags per content**: Articles and Case Studies may have 0-2 Tags.

**Badge display**:
- **Mixed Article lists** (Index Featured and All, which include News + Editorial + Zine): Show Type badge + max 1 Tag (2 labels total)
- **Type-specific lists** (Zine Issue article list, which is only Zine Articles): Hide Type badge, show up to 2 Tags

**Badge location**: All labels (Type badge, Tags) appear in the media-frame top-left corner, not in the Info block.

**Case Study cards**: Case Study cards never show Type badges (there is no mixed Work list). They show 0-2 Tags in media-frame top-left.

## Validation Matrix

| Rule | Enforcement | Error Behavior |
| --- | --- | --- |
| Article `articleType` is required | Blocking | Cannot publish |
| Article `body` required (except News) | Blocking | Cannot publish |
| News `body` or `externalCoverage` required (at least one) | Blocking | Cannot publish |
| News `cardDestination === 'external'` requires exactly one `isPrimary` coverage link | Blocking | Cannot publish |
| Article `relatedItems` is empty or exactly three | Blocking | Cannot publish (reject 1 or 2) |
| Article `tags` max 2 | Blocking | Cannot publish |
| Card width `left`/`right` Info position requires card width >= `1/2` | Blocking | Cannot publish |
| Two-block Content Layout Row widths must total `full` | Blocking | Cannot publish |
| Zine Issue `articles` must reference `articleType === 'zine'` only | Blocking | Cannot publish |
| Zine Issue must have exactly one of `issuuUrl` or `pdfAsset` | Blocking | Cannot publish |
| Zine Article published without exactly one Issue reference | Blocking + pre-launch audit | Cannot publish; audit fails |
| Zine Article already referenced by another Issue | Advisory | Warning in Studio |
| Case Study `publicationDate` required | Blocking | Cannot publish (new requirement) |
| Featured section duplicate cards (Index, Work) | Blocking | Cannot publish |
| Featured cards excluded from All | Enforced by query | N/A |
| Row-flow whitespace warnings | Non-blocking | Warning only |
| Content Card aspect ratio invalid for `left`/`right` Info (no specific ratio constraint) | Non-blocking | Visual warning |

## Rendering Behavior

### Content Card rendering

1. Resolve card settings via inheritance chain (per-item override > list default > content default > global default)
2. Determine Media aspect ratio (crop unless `intrinsic`)
3. Render Media Frame with resolved ratio
4. Apply Tags/badges to media-frame top-left
5. Render Info block at resolved position (below, left, right)
6. Apply card width to container
7. Link entire card to destination (internal detail or external URL for News with `external` destination)

**Featured masonry**: Grid packs columns independently. May result in whitespace at row ends. This is acceptable and expected.

**Non-Featured row-flow**: Rows place cards left-to-right, wrap before overflow, and may leave intentional whitespace at row ends. Studio provides a non-blocking incomplete-row warning without an arbitrary whitespace threshold.

### Content Layout Row rendering

1. Parse row structure (1 or 2 blocks, Media or Text)
2. Validate two-block widths total `full`
3. For single narrow block, apply alignment (left, center, right)
4. Render Media blocks with Media Frame at resolved ratio
5. Render Text blocks with optional heading + rich text
6. Stack two-block rows full width below 1024px in authored order
7. Apply full bleed to qualifying single full-width Media rows

### Progressive enhanced endless scroll

**Server-side rendering**: First batch of All section cards rendered in initial HTML with real next-page URL.

**Baseline (no JavaScript)**: Load More button at batch end links to next-page URL (`?page=2`, `?page=3`, etc.). Server renders next batch at top of All section.

**Enhanced (JavaScript enabled)**:
- Monitor scroll position
- Auto-load next batch when user scrolls near viewport end
- Replace Load More button with loading indicator during fetch
- Append new batch to existing cards
- Update URL without page reload (History API)
- Preserve keyboard/AT direct activation of Load More before auto-load triggers
- Retry on fetch error with user-visible error message

**Batch size**: Shared frontend-owned constant (e.g., 12 cards per batch). Not exposed to CMS.

**Sort parameter**: URL query `?sort=newest` (default) or `?sort=oldest`. Applies to All section only. Featured order is manual.

**Tag source filter (Index All only)**: Editors may select one optional Tag in the Index singleton. The query limits All to Articles with that Tag. No selected Tag means all Articles. This is a CMS source rule, not a visitor-facing filter control.

## Responsive Behavior

| Breakpoint | Content Card | Content Layout Row |
| --- | --- | --- |
| Desktop (>= 1024px) | Row-flow or masonry at authored widths; Info at authored position (below, left, right) | Two-block rows side-by-side at authored widths; single-block rows at authored alignment |
| Mobile (< 1024px) | Full width; Info always below | Two-block rows stack full width in authored order; single-block rows full width or authored alignment |

**Horizontal carousel exception**: Cards in explicit horizontal carousels (e.g., homepage News carousel) remain narrow width on mobile but Info always stays below.

**Media Frame visibility-aware playback**: Hidden video is always paused (offscreen media, inactive carousel slides, background browser tabs). Media Frame owns this behavior; Content Card and Content Layout Row rely on it.

## Migration and Cutover Policy

**Pre-launch policy**: Clarity over compatibility. Destructive schema replacement and manual content re-entry are allowed. No compatibility layers or broad migration burden.

**Index and Our Work Featured**: Existing Featured sections start empty for re-curation. Content owners will manually select and configure 1-4 Featured cards per page.

**Case Study publication date**: Existing Case Studies missing `publicationDate` must add one manually. No automated backfill (publication dates should be accurate, not fabricated).

**Zine stale field cleanup**: Narrow migration script removes obsolete fields (`coverAspectRatio`, `coverMedia`, `introHeadline`, `introText`, `issueNumber`, `publicationDate` at Issue level) to clear Studio errors. Does not migrate content (manual re-entry expected).

**Article model unification**: The shared `article` document with hidden `articleType` replaces separate authored schemas described in older documentation. Because the site is unpublished and contains little content, editors may manually re-enter or reclassify the current records. Do not add compatibility layers or a broad Article migration framework.

**Safety snapshot**: Export the Sanity dataset before destructive cleanup. Restoration uses Sanity CLI import. The cutover does not require the frontend to support old and new schemas simultaneously.

## Testing and Acceptance Criteria

### Automated validation

- Schema contract tests (Vitest in `@superbloom/schemas`):
  - Article `articleType` discriminator
  - Article `body` required (except News)
  - News `body` or `externalCoverage` required
  - Article `relatedItems` empty or exactly three
  - Card settings inheritance chain
  - Content Layout Row two-block width constraint
  - Zine Issue `articles` type constraint
  - Zine Issue ISSUU or PDF required
  - Case Study `publicationDate` required
- GROQ query tests (verify projections include all required fields)
- Generated type tests (TypeScript compilation without errors)

### Manual verification

- **Index Page**:
  - Featured section hidden at 0 cards
  - Featured 1-4 cards with manual order and full configuration
  - All section excludes Featured cards
  - Sort toggle changes order (newest/oldest)
  - Optional CMS Tag source filter limits All; no selected Tag includes every Article
  - Load More loads next batch without JavaScript
  - Auto-load triggers near viewport end with JavaScript
  - External News card links to coverage URL with new-tab indicator
  - Internal News card links to `/news/[slug]`
  - Editorial Article card links to `/articles/[slug]`
  - Type badge + max 1 Tag on mixed list
  - Publication date visible on Article cards

- **Our Work page**:
  - Featured section hidden at 0 cards
  - Featured 1-4 Case Studies with manual order and full configuration
  - All section excludes Featured cards
  - Sort toggle changes order (newest/oldest)
  - Load More loads next batch without JavaScript
  - Auto-load triggers near viewport end with JavaScript
  - Case Study card links to `/work/[slug]`
  - 0-2 Tags on Case Study cards (no Type badge)
  - Publication date NOT visible on Case Study cards

- **Article Detail** (News, Editorial, Zine):
  - Article hero with title, publication date, tags
  - Lead media full width
  - Body renders Content Layout Rows correctly
  - Two-block rows side-by-side on desktop, stacked on mobile
  - Single narrow block alignment (left, center, right) on desktop
  - Full bleed Media rows extend beyond content margins
  - External coverage (News only) renders links with new-tab indicator
  - Related items render zero or three cards (never one or two)

- **Zine Issue**:
  - Issue page renders ordered article list with correct order
  - Article list uses row-flow layout with list default + per-item overrides
  - Each article card links to `/zine/issues/[issue-slug]/[article-slug]`
  - Zine Article type badge hidden on type-specific list
  - Up to 2 Tags visible on Zine Article cards
  - ISSUU embed or PDF CTA renders (not both)

- **Content Card responsive**:
  - Desktop: authored widths, Info at authored position
  - Mobile: full width, Info always below (except carousel remains narrow)
  - Left/right Info positions revert to below on mobile

- **Content Layout Row responsive**:
  - Desktop: two-block rows side-by-side, single-block rows at alignment
  - Mobile: two-block rows stack, single-block rows full width

- **Accessibility**:
  - All cards keyboard-operable with visible focus
  - External links indicate new-tab behavior (text + icon)
  - Load More works without JavaScript
  - Media alt text rendered (Media Frame owns this)
  - Publication dates use semantic `<time>` elements
  - Sort toggle keyboard-operable
  - Section navigation keyboard-operable (Case Study Spine)

- **Performance**:
  - First batch SSR (no CLS)
  - Load More appends without re-rendering existing cards
  - Video pauses when offscreen (Media Frame owns this)

## Sequencing and Dependencies

### Phase 1: Schema foundation
- Add unified `article` schema with hidden `articleType` discriminator
- Add Content Card settings fields to all content types
- Add Content Layout Row block types
- Add Zine Issue `articles` array
- Remove Zine stale fields
- Add Case Study `publicationDate` field
- Update Tag taxonomy to shared
- Schema contract tests

### Phase 2: CMS updates
- Create separate Studio views for News, Editorial, Zine
- Update Index Page singleton (Featured + Tag filter option)
- Update Our Work singleton (Featured)
- Update Zine Issue schema (remove stale fields, add ISSUU/PDF choice)
- Blocking validations (body, coverage, relatedItems, card settings, row widths)
- Advisory validations (Zine Article membership)
- Pre-launch audit script (Zine Article exactly-one Issue)

### Phase 3: Query and types
- Update GROQ queries (Index, Work, Article detail, Zine)
- Add pagination support to All sections
- Regenerate types

### Phase 4: Frontend components
- Content Card adapters (News, Editorial, Zine Article, Case Study)
- Content Card settings inheritance resolver
- Content Layout Row renderer (Media block, Text block)
- Featured section renderer (masonry)
- All section renderer (row-flow + Load More)
- Progressive enhancement script (auto-load)
- Sort toggle component

### Phase 5: Routes
- Update Index Page route (`/index`)
- Update Our Work route (`/work`)
- Update News route (`/news/[slug]`)
- Add Editorial Article route (`/articles/[slug]`)
- Update Zine routes (`/zine`, `/zine/issues/[issue-slug]`, `/zine/issues/[issue-slug]/[article-slug]`)
- Add canonical URL and redirect logic (Zine current Issue)

### Phase 6: Migration and cutover
- Export Sanity dataset backup
- Run Zine stale field cleanup
- Manually re-enter or reclassify the small Article content set
- Manually add Case Study publication dates
- Manually re-curate Index and Work Featured sections
- Run pre-launch audit
- Deploy frontend
- Verify all routes and interactions

### Dependencies

- Media Frame component must exist and own visibility-aware playback (already implemented per case-study-spine-implementation-spec.md)
- Media Asset fields and field-level Mux upload/selection must remain available
- Tag taxonomy must exist (already implemented per existing specs)
- Case Study Spine fixed structure must exist (already implemented per case-study-spine-implementation-spec.md)
- Surface Role system must exist (already implemented per CONTEXT.md references)

## Documentation Supersession Matrix

| Existing Document | Status | Superseded Sections | Preserved Sections |
| --- | --- | --- | --- |
| `editorial-index-and-article-implementation-spec.md` | Superseded | Index Page structure, Article schema, card settings, Featured section, body modules, Sort control | Related-items intent and progressive Load More requirements are incorporated here |
| `zine-implementation-spec.md` | Superseded | Zine Issue schema, Zine Article schema, card configuration, reading-format contract | Zine landing, Past Issues, and Editor Letter requirements are incorporated here |
| `work-index.md` | Fully superseded | Work page structure, card settings, Featured section, Sort control | N/A |
| `news-card.md` | Partially superseded | Card settings, Info position | Card adapter structure (remains separate) |
| `index-page.md` | Fully superseded | Index Page structure, Featured section, View All section | N/A |
| `2-up.md`, `text-media-50-50.md` | Amended | Their detail-page layout roles are replaced by Content Layout Row | Any non-editorial uses remain governed by their own Figma evidence |
| ADR-0018 (editorial-article-separate-model) | Contradicted | Separate Editorial Article schema | Editorial identity preserved via Studio views and routes |
| ADR-0011 (news-content-model) | Partially superseded | News-specific body schema | News external coverage behavior |
| ADR-0012 (work-index-card-model) | Partially superseded | Work index structure, card settings | Case Study card adapter |

**Documentation requirement**: Reconcile every conflicting active document alongside this specification. Preserve ADR history with prominent superseded or amended notices and add a new ADR for the composition model.

## Issue Decomposition Seams

This specification is decomposable into the following independent implementation issues (suggested breakdown, not prescriptive):

1. **Schema: Unified Article model**
   - Add `article` schema with hidden `articleType` discriminator
   - Add Studio views for News, Editorial, Zine
   - Schema contract tests

2. **Schema: Content Card settings**
   - Add `cardWidth`, `mediaAspectRatio`, `infoPosition` to Article and Case Study
   - Add global defaults
   - Validation: left/right Info requires width >= 1/2
   - Schema contract tests

3. **Schema: Content Layout Row**
   - Add Media block and Text block types
   - Add row structure (1-2 blocks)
   - Validation: two-block widths total `full`
   - Schema contract tests

4. **Schema: Zine Issue updates**
   - Remove stale fields (coverAspectRatio, coverMedia, introHeadline, introText, issueNumber, publicationDate at Issue level)
   - Add ISSUU vs. PDF choice (exactly one required)
   - Update `articles` array (ordered, min 1, type constraint)
   - Advisory validation (Article referenced by another Issue)
   - Pre-launch audit script (Article exactly-one Issue)
   - Cleanup migration script

5. **Schema: Case Study publication date**
   - Add required `publicationDate` field
   - Schema contract tests
   - Manual data entry required (no migration)

6. **Schema: Tag and badge rules**
   - Confirm Tag taxonomy shared across all content
   - Add `tags` max 2 validation to Article and Case Study
   - Schema contract tests

7. **CMS: Index Page singleton**
   - Update Featured section (1-4 cards, full configuration, excludes duplicates)
   - Add optional Tag source filter to All section
   - Validation: Featured duplicates, Featured excluded from All

8. **CMS: Our Work singleton**
   - Update Featured section (1-4 Case Studies, full configuration, excludes duplicates)
   - Validation: Featured duplicates, Featured excluded from All

9. **Query: Index Page queries**
   - Update Featured query (1-4 cards with card settings)
   - Update All query (exclude Featured, pagination, sort, optional Tag filter)
   - Regenerate types

10. **Query: Our Work queries**
    - Update Featured query (1-4 Case Studies with card settings)
    - Update All query (exclude Featured, pagination, sort)
    - Regenerate types

11. **Query: Article detail queries**
    - Update News, Editorial, Zine Article queries
    - Include unified Article fields
    - Include Content Layout Row projections
    - Regenerate types

12. **Component: Content Card adapters**
    - News card adapter (with external destination support)
    - Editorial Article card adapter
    - Zine Article card adapter
    - Case Study card adapter
    - Settings inheritance resolver
    - Tag/badge display rules (Type badge + Tags)

13. **Component: Content Card rendering**
    - Media Frame integration (aspect ratio, loading, playback)
    - Info block positioning (below, left, right)
    - Card width application
    - Card linking (internal/external)
    - Responsive behavior (mobile full width, Info below)

14. **Component: Content Layout Row rendering**
    - Media block renderer (Media Frame + aspect ratio)
    - Text block renderer (optional heading + rich text)
    - Row layout (1-2 blocks, widths, alignment)
    - Full bleed support
    - Responsive behavior (mobile stack)

15. **Component: Featured section**
    - Masonry layout (columns pack independently)
    - Manual order (1-4 cards)
    - Hidden at 0 cards

16. **Component: All section with progressive enhancement**
    - Row-flow layout (wrap before overflow)
    - SSR first batch
    - Load More button (works without JavaScript)
    - Auto-load near viewport (JavaScript enhanced)
    - Retry on error
    - Sort toggle (newest/oldest)

17. **Route: Index Page**
    - Update `/index` route
    - Render Featured + All sections
    - Pagination support
   - Sort and pagination query params

18. **Route: Our Work**
    - Update `/work` route
    - Render Featured + All sections
    - Pagination support
    - Sort query param

19. **Route: Article detail**
    - Update `/news/[slug]` route
    - Add `/articles/[slug]` route
    - Update `/zine/issues/[issue-slug]/[article-slug]` route
    - Render unified Article detail with Content Layout Rows

20. **Route: Zine updates**
    - Update `/zine` route (current Issue)
    - Update `/zine/issues/[issue-slug]` route (archive with redirect)
    - Canonical URL and redirect logic

21. **Content: Article re-entry**
    - Re-enter or reclassify the small pre-launch Article content set
    - Verify routes and references under the shared `articleType` model

22. **Migration: Zine stale field cleanup**
    - Remove obsolete fields
    - Clear Studio errors
    - Verify no blocking issues

23. **Testing: Automated validation**
    - Schema contract tests (all phases)
    - GROQ query tests
    - Generated type tests (TypeScript compilation)

24. **Testing: Manual verification**
    - Desktop and mobile responsive checks
    - Accessibility checks (keyboard, focus, semantics)
    - Performance checks (SSR, CLS, video pause)
    - All routes and interactions per acceptance criteria

25. **Documentation: Updates**
    - Add the composition ADR
    - Mark historical ADRs superseded or amended
    - Reconcile all conflicting design-system documents and `CONTEXT.md`

## Acceptance Criteria Summary

- Studio enforces all blocking validations at publication time while allowing incomplete drafts where Sanity supports it
- Studio blocks publishing Zine Articles with anything other than one Issue reference
- Pre-launch audit fails if any published Zine Article has != 1 Issue reference
- Index Page Featured hidden at 0 cards, renders 1-4 cards with manual order
- Index Page All excludes Featured and includes every published Article, optionally narrowed by one CMS-selected Tag
- Our Work Featured hidden at 0 cards, renders 1-4 Case Studies with manual order
- Our Work All excludes Featured, includes all published Case Studies
- Sort toggle changes order (newest/oldest) on both Index and Work pages
- Load More works without JavaScript (real pagination URLs)
- Auto-load triggers near viewport with JavaScript
- News external cards link to coverage URL with new-tab indicator
- Article internal cards link to correct routes (News `/news/[slug]`, Editorial `/articles/[slug]`, Zine `/zine/issues/[issue-slug]/[article-slug]`)
- Case Study cards link to `/work/[slug]`
- Type badge + max 1 Tag on mixed Article lists
- Type badge hidden + up to 2 Tags on type-specific lists
- Publication date visible on Article cards, hidden on Case Study cards
- Content Card responsive: full width on mobile, Info below (except carousel narrow)
- Content Layout Row responsive: two-block rows stack on mobile
- Article Detail renders Content Layout Rows correctly (1-2 blocks, widths, alignment, full bleed)
- Related items render zero or three cards (never one or two)
- Zine Issue renders ordered article list with correct order
- Zine current Issue redirects `/zine/issues/[slug]` to `/zine` (302)
- Zine non-current Issue renders at archive URL with canonical self-reference
- ISSUU embeds or PDF CTA renders (not both)
- All interactions keyboard-operable with visible focus
- Media alt text rendered, video pauses when offscreen
- Desktop and mobile presentation match signed-off Figma (nodes 1:4790, 1:4816)

## Validation Commands

Run from repository root:

```sh
pnpm --filter @superbloom/schemas test
pnpm typegen
pnpm --filter web astro check
pnpm --filter web build
pnpm --filter studio build
```

Then manually verify all routes, interactions, responsive behavior, and accessibility per acceptance criteria above.

---

**Implementation notes**:

- This spec prioritizes clarity and completeness over brevity. Implementation teams should read it once in full before starting work.
- Card settings inheritance chain is complex but deterministic. Implement resolver as pure function with comprehensive tests.
- Content Layout Row two-block width constraint should be enforced at schema level (structural fields) and validated at Studio UI level (hide invalid combinations).
- Progressive enhancement endless scroll requires careful SSR + client-side coordination. Test baseline (no JavaScript) first, then enhance.
- Zine Article membership validation allows drafts but blocks publication unless exactly one Issue references the Article. The pre-launch audit verifies the same invariant across the dataset.
- Pre-launch policy (destructive changes allowed) is time-limited to project launch. Post-launch, migration strategies must preserve existing content.
