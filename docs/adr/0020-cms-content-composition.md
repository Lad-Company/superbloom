# Unified CMS content composition

**Status:** Accepted

**Decision source:** `docs/design-system/cms-content-composition-spec.md`

Superbloom uses two distinct shared compositions:

- **Content Card** is the listing composition for News, Editorial Article, Zine Article, and Case Study adapters. It owns Card Width, Media Aspect Ratio, and Info Position. Non-Featured lists resolve settings through per-item override, list default, content default, then global default. Featured cards fully configure all three settings.
- **Content Layout Row** is the detail-page composition inside Article bodies and all five Case Study Spine sections. A row contains one or two Media or Text blocks with fractional widths, alignment for a single narrow block, and full bleed for qualifying media.

Both compositions reuse Media Asset and Media Frame, but they do not share layout controls. Content adapters remain separate; this decision does not create a universal content data model.

News, Editorial, and Zine share one `article` document with a required hidden `articleType` discriminator. Separate Studio views and create actions preset and hide that field. Each identity retains its own route and adapter. Zine Issue membership remains the sole authority for Zine Article publication and order.

The Index Page includes all three Article types. It has an optional manually ordered Featured section and a required publication-date-sorted All section that excludes Featured. Editors may narrow All by one optional Tag. Our Work follows the same Featured and All structure for Case Studies only; Case Studies require Publication Date. Neither All section uses manual document ranking.

Articles and Case Studies may have zero to two Tags. Mixed Article lists show a required Type badge plus at most one Tag. Type-specific lists hide the Type badge and show up to two Tags. Case Study cards show no Type badge and up to two Tags.

The Case Study Spine remains fixed as Highlights, Challenge, Unexpected Insight, Big Idea, and Results. Every section accepts Content Layout Rows. Results retains its required stats treatment.

A dedicated Video Library is deferred. Media fields continue to support field-level Mux upload and selection.

The full schema contracts, validation matrix, responsive behavior, rendering rules, migration policy, and acceptance criteria live in `docs/design-system/cms-content-composition-spec.md`. That approved specification is authoritative where older implementation specifications conflict.

**Supersession:**

- Fully supersedes ADR-0018.
- Partially supersedes ADR-0011's standalone News storage and body schema while preserving composite News and external coverage behavior.
- Partially supersedes ADR-0012's card component, full/half layout, manual Work ranking, and Work index structure while preserving the Case Study adapter, dedicated card media, and Tag taxonomy.
- Amends ADR-0015's evidence authority for CMS composition.
- Partially supersedes ADR-0016's Editorial Card terminology and separate Article/Case Study detail layout systems while preserving deep component boundaries.
- Partially supersedes ADR-0017's section-local standardized media layouts while preserving the fixed Case Study Spine and Results stats.

**Why:** The former documents described overlapping card systems, separate article schemas, incompatible detail-page layouts, and conflicting browse-page membership. One composition contract creates consistent authoring and rendering while preserving editorial identities and fixed narrative structures.

**Reversibility:** Medium. The site is pre-launch, so destructive schema replacement and manual content re-entry are acceptable now. After launch, changing shared Article storage or composition fields requires content-safe migration.
