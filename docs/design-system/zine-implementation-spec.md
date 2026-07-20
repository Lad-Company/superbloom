# Zine implementation specification

**Status:** Ready for implementation  
**Design source:** [Zine](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-500&m=dev), [Article Detail](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-652&m=dev), [Homepage Zine promo](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev)

## Goal

Implement the Zine publication system: Issues, Zine Articles, Zine landing page, Issue archive page, Article Detail, and Homepage Zine promo section. The Zine is Superbloom's editorial publication, organized into discrete Issues. Each Issue owns the complete signed-off composition, an ordered table of contents, and a PDF edition.

## Scope

This implementation includes:

- Zine Issue and Zine Article Sanity schemas
- Zine landing singleton for current Issue selection
- Zine landing route at `/zine` for current Issue
- Issue archive route at `/zine/issues/[issue-slug]`
- Zine Article route at `/zine/issues/[issue-slug]/[article-slug]`
- Homepage `homeZine` editorial block
- Canonical URL and redirect rules for current vs archive
- Schema contract tests
- Manual responsive verification

It does not redesign Article Detail body rendering (Zine Articles share the same Article Detail component as News/Editorial Articles) or implement Shop or motion.

## Content contract

### Zine Issue document

| Field | Type | Contract |
| --- | --- | --- |
| `issueNumber` | integer | Required; positive and unique |
| `title` | string | Required; Issue title (e.g., "The Gardening Issue") |
| `slug` | slug | Required; unique; used in `/zine/issues/[issue-slug]` |
| `publicationDate` | datetime | Required; used for archive sort |
| `coverMedia` | `mediaBox` | Required; Issue cover image or video |
| `coverAspectRatio` | enum | Required; `16:9`, `1:1`, `4:5`, `9:16`, `3:2` |
| `introHeadline` | string | Required; Issue intro headline on landing page |
| `introText` | Portable Text | Required; Issue intro copy |
| `introMedia` | `mediaBox` array | Required; exactly five items for the signed-off intro collage |
| `editorLetter` | object | Required; headline, Portable Text body, and `mediaBox` |
| `articles` | Zine Article references | Required; ordered; minimum one; complete table of contents for Issue |
| `pdfAsset` | file | Required PDF Sanity asset; target of "Read the Zine" |

Each Issue owns its complete ordered articles list. The Issue detail page renders the signed-off composition and every article card in authored order. "Read the Zine" opens the PDF in a new tab.

### Zine Article document

| Field | Type | Contract |
| --- | --- | --- |
| `title` | string | Required |
| `slug` | slug | Required; unique among Zine Articles; used in `/zine/issues/[issue-slug]/[article-slug]` |
| `overview` | Portable Text | Required; shown on Article Detail and card |
| `body` | ordered array | Required; accepts `articleTextSection` and `articleMediaSection` only |
| `leadMedia` | `mediaBox` | Required; full-width media after the Article hero |
| `cardMedia` | `mediaBox` | Required; article card media |
| `cardAspectRatio` | enum | Required; `16:9`, `1:1`, `4:5`, `3:2` |
| `tags` | Tag references | Optional; max 2; shared taxonomy with News, Editorial Articles, Case Studies |
| `relatedItems` | references | Optional; zero or exactly three; accepts News, Editorial Articles, and Zine Articles; excludes current document |

The Issue's ordered `articles` array is the single source of truth for membership and order. Do not duplicate that relationship on Zine Article documents. An async Issue validator reports when a selected Article is already referenced by another Issue, and a launch audit enforces exactly-one membership for every published Zine Article. Zine Articles do not appear on the Index Page (`/index`); they are exclusive to Zine routes.

### Zine landing singleton

The `zineLanding` singleton selects the current Issue:

| Field | Type | Contract |
| --- | --- | --- |
| `currentIssue` | Issue reference | Required; the Issue shown at `/zine` |

The Zine landing route (`/zine`) fetches `currentIssue` and renders it. Changing `currentIssue` changes what appears at `/zine` without changing the Issue slug or archive URL.

### Homepage Zine promo block

The `homeZine` block (part of `homepage.sections[]` Editorial Composition):

| Field | Type | Contract |
| --- | --- | --- |
| `issue` | Issue reference | Required; the Issue being promoted |
| `promoHeadline` | string | Required; custom promo headline (may differ from Issue title) |
| `promoIntro` | Portable Text | Required; custom promo copy |
| `promoMedia` | `mediaBox` | Required; custom promo media (may differ from Issue cover) |
| `ctaLabel` | string | Required; CTA button label (e.g., "Explore Issue 01") |

This block explicitly references an Issue and owns its own headline, intro, media, and CTA label. It does not automatically mirror `currentIssue`; editors choose which Issue to promote and customize the promo content.

## Route and canonical behavior

### `/zine` (Zine landing)

- Fetches `zineLanding.currentIssue`
- Renders Issue cover, "Explore the Issue" CTA (scrolls to the intro), intro statement and collage, Editor Letter, all ordered article cards, Past Zines, and "Read the Zine" CTA (opens the PDF in a new tab)
- Canonical URL: `/zine`
- This is the primary Zine entry point

### `/zine/issues/[issue-slug]` (Issue archive)

- Fetches Issue by slug
- Renders same content as `/zine` (intro, articles, PDF)
- If this Issue is the current Issue, serve a temporary redirect to `/zine`; current status can change, so do not cache a permanent redirect
- If this Issue is not current, render normally with canonical self-reference
- This prevents duplicate indexing of current Issue

### `/zine/issues/[issue-slug]/[article-slug]` (Zine Article detail)

- Fetches Zine Article by Issue slug + article slug
- Renders Article Detail (same shared component as News/Editorial Articles)
- The Article Detail related module follows the record's curated `relatedItems` contract (zero or exactly three)
- Canonical URL: `/zine/issues/[issue-slug]/[article-slug]`

## Schema implementation

Add schema files under `packages/schemas/src/`:

- `zineIssue.ts`
- `zineArticle.ts`
- `zineLanding.ts`
- `homeZine.ts`
- `zineContract.ts` containing validation functions

Register all types in `packages/schemas/src/index.ts`. Add `homeZine` to the `homepage.sections[]` allowlist.

Validation:
- Issue `articles` must contain at least one unique reference
- Issue `pdfAsset` is required
- `zineLanding.currentIssue` is required
- `issueNumber` is a unique positive integer
- `introMedia` contains exactly five entries
- `pdfAsset` resolves to a PDF file
- `relatedItems` contains zero or exactly three unique references and excludes the current Article
- an Article is not referenced by another Issue; enforce with async advisory validation and the blocking launch audit rather than a circular Article-to-Issue reference

## Query and generated types

Add to `apps/web/src/lib/queries.ts`:

**zineLandingQuery**: fetch `zineLanding` singleton with `currentIssue` fully projected (title, slug, cover, intro collage, Editor Letter, ordered articles with card fields, PDF), plus all other Issues for Past Zines.

**issueBySlugQuery**: fetch Issue by slug with all fields including ordered articles.

**zineArticleBySlugQuery**: fetch the Issue by Issue slug, resolve the matching referenced Article by Article slug, and project the full Article Detail contract, including curated `relatedItems`. An Article not referenced by that Issue is not found.

**issueArchiveQuery**: fetch all other Issues in reverse-chronological order for the Past Zines section, excluding the Issue being rendered.

Run `pnpm typegen`.

## Component boundary

Add `apps/web/src/components/zine/`:

- `IssueDetail.astro`: Issue hero, intro collage, Editor Letter, article cards, Past Zines, and "Read the Zine" CTA
- `ZineArticleCard.astro`: card adapter for Zine Article
- `PastIssues.astro`: renders all other Issues in reverse-chronological order

Zine Articles reuse `ArticleDetail.astro` and its curated related-item contract.

Homepage `homeZine` block at `apps/web/src/components/blocks/HomeZine.astro`:
- Renders promo media, headline, intro, CTA linking to `/zine` or `/zine/issues/[issue-slug]` (depending on whether the promoted Issue is current)

## Route implementation

### `/zine` route

`apps/web/src/pages/zine/index.astro`:

```astro
---
const zineLanding = await fetchZineLanding()
if (!zineLanding?.currentIssue) return renderNotFound(Astro)
const issue = zineLanding.currentIssue
---

<Layout>
  <Navigation slot="navigation" role="surface" />
  <IssueDetail issue={issue} />
  <ContactBand role="brand-deep" />
  <Footer />
</Layout>
```

### `/zine/issues/[issue-slug]` route

`apps/web/src/pages/zine/issues/[issue-slug].astro`:

```astro
---
const { 'issue-slug': issueSlug } = Astro.params
const issue = await fetchIssueBySlug(issueSlug)
if (!issue) return renderNotFound(Astro)

const zineLanding = await fetchZineLanding()
const isCurrent = zineLanding?.currentIssue?.slug === issue.slug

if (isCurrent) {
  return Astro.redirect('/zine', 302)
}
---

<Layout canonicalUrl={`/zine/issues/${issue.slug}`}>
  <Navigation slot="navigation" role="surface" />
  <IssueDetail issue={issue} />
  <ContactBand role="brand-deep" />
  <Footer />
</Layout>
```

### `/zine/issues/[issue-slug]/[article-slug]` route

`apps/web/src/pages/zine/issues/[issue-slug]/[article-slug].astro`:

```astro
---
const { 'issue-slug': issueSlug, 'article-slug': articleSlug } = Astro.params
const article = await fetchZineArticleBySlug(issueSlug, articleSlug)
if (!article) return renderNotFound(Astro)
---

<Layout>
  <Navigation slot="navigation" role="surface" />
  <ArticleDetail article={article} />
  <ContactBand role="brand-deep" />
  <Footer />
</Layout>
```

## Presentation and behavior

`renderNotFound` denotes the shared not-found response defined by the MVP completion spec; it renders the site's 404 composition with HTTP status 404 and does not redirect.

Match the signed-off Figma:

- Zine landing (`/zine`): full-bleed cover, Issue title, intro and five-item collage, "Explore" CTA scrolls to the intro, Editor Letter, complete article carousel, Past Zines list, and "Read the Zine" CTA opening the PDF in a new tab
- Issue archive: identical presentation to landing when not current
- Zine Article detail: shared Article Detail layout with optional curated related cards
- Homepage `homeZine`: media left, text block right with promo headline, intro, CTA; fixed brand color (`#99a224` green)

Desktop and mobile responsive behavior:
- Desktop: two-column text/media layout for `homeZine`; card grid for articles
- Below `1024px`: stack layouts, maintain readable hierarchy
- "Explore" CTA uses smooth scroll with `prefers-reduced-motion` safety

## Accessibility and baseline requirements

- Issue cover media includes alt text via `MediaFrame`
- "Read the Zine" PDF link indicates new-tab behavior
- "Explore" scroll-to-intro works with keyboard and respects reduced motion
- Related items and Past Zines sections use labeled navigation landmarks
- Zine Article cards keyboard-operable with visible focus
- All routes work with JavaScript disabled (no client-side routing required)

## SEO and metadata

- `/zine` canonical URL points to `/zine`
- `/zine/issues/[issue-slug]` redirects to `/zine` if current; otherwise canonical self
- Zine Articles have unique meta titles including Issue name
- PDF asset URL exposed in structured data as downloadable resource
- Sitemap includes `/zine`, all archive Issue pages (non-current only), and all Zine Article pages

## Implementation sequence

1. Add schema contract tests for Issue, Zine Article, and Zine landing
2. Add Zine Issue, Zine Article, Zine landing, and `homeZine` block schemas
3. Update GROQ queries and regenerate types
4. Build `IssueDetail`, `ZineArticleCard`, and `PastIssues` components
5. Build `homeZine` block component
6. Add all three Zine routes with canonical/redirect logic
7. Update `homepage.sections[]` to include `homeZine` allowlist
8. Update sitemap generation to include Zine routes
9. Run automated validators
10. Run desktop and mobile QA against signed-off Figma

## Acceptance criteria

- Studio cannot publish Zine Issue without PDF asset
- Studio prevents duplicate Article references within an Issue and warns when another Issue already references the selected Article
- The pre-launch content audit fails unless every published Zine Article belongs to exactly one Issue
- Zine landing displays current Issue
- Changing `zineLanding.currentIssue` changes `/zine` content
- Archive route redirects to `/zine` when Issue is current
- Zine Articles route to `/zine/issues/[issue-slug]/[article-slug]`
- Issue page shows every Article once in authored order
- Article Detail shows either zero or exactly three curated related cards
- "Read the Zine" opens PDF in new tab
- "Explore" CTA scrolls to intro section with reduced-motion safety
- Homepage `homeZine` block renders promo content with fixed green background
- Desktop and mobile presentation match signed-off Figma
- All routes work without JavaScript
- Sitemap excludes `/zine/issues/[current-issue-slug]` (because it redirects)

## Validation

Run from the repository root:

```sh
pnpm --filter @superbloom/schemas test
pnpm typegen
pnpm --filter web astro check
pnpm --filter web build
pnpm --filter studio build
```

Then manually verify all Zine routes, Homepage Zine promo, canonical/redirect behavior, PDF opening, Article order, Past Zines, curated related cards, and responsive layouts at desktop and mobile widths.
