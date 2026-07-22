# Work index card model and shared Card component

> **Amended and partially superseded by ADR-0020.**
>
> **Replaced decisions:** `Card.astro`, `EditorialCard`, `cardSize`, full/half-only rows, and `orderRank` no longer define Work. Our Work uses Content Cards with `cardWidth`, `mediaAspectRatio`, and `infoPosition`. Featured contains 1 to 4 manually ordered, fully configured Case Studies. All is a live publication-date-sorted query, excludes Featured, and uses row flow with list defaults plus partial item overrides. Case Studies now require `publicationDate`.
>
> **Preserved decisions:** Work is composed only of Case Studies. Case Studies retain dedicated card media, the shared Tag taxonomy, and a Case Study-specific content adapter.
>
> The text below records the historical rationale and is not current implementation guidance. See ADR-0020 and `docs/design-system/cms-content-composition-spec.md`.

## Historical record

The Work index (`/work`) renders each Case Study as a card in an editorial grid. The card data lives on the `caseStudy` document, because a Work card *is* a Case Study (`CONTEXT.md`: Work is composed of Case Studies). Four fields were added to `caseStudy`: `cardMedia` (array of `mux.video`|`image`, max 1), `cardAspectRatio` (`1:1`/`16:9`/`4:5`/`2:1`), `tags` (array of references to `tag`, max 2), and `cardSize` (`full`/`half`, default `half`). The existing `summary` is reused as the card's description line.

**Card media is a dedicated field, not `heroVideo`**: the grid thumbnail is an art-directed image or video distinct from the case study hero. Mirroring the `news` media shape (`media[0]` + `aspectRatio`) lets News and Work share one GROQ projection and one component.

**Shared `Card.astro`**: Figma uses a single "News Card" for both News and Work, so the markup/styles were lifted into `Card.astro` (props: `href`, `title`, `media`, `aspectRatio`, `tags`, `summary`, `size`, `showSummary`). `NewsCard.astro` now delegates to it (preserving its `/news/<slug>` href and call sites); the Work grid consumes `Card` directly with `size="fill"`. A `fill` size variant makes a card flex to its row cell, versus the fixed-width `large`/`small` used by the carousel.

**Tags reuse the `tag` taxonomy** (the same dedicated `tag` document News uses), not `capabilities`/`deliverables`. A Tag is a free editorial label; a capability is a named service offering (`CONTEXT.md`). Sharing the taxonomy keeps the pill styling and projection identical across News and Work.

**Layout: per-card aspect ratio + full/half rows** (from R3 node 4394-2448), replacing the earlier design-system spec's "large/small alternation". R3 mixes two-up rows with occasional full-width cards, so the arrangement is editorial, not a fixed pattern. `cardSize` is authored per Case Study; the page packs cards in order. A `full` card takes its own row, consecutive `half` cards pair two-per-row.

**Ordering via `@sanity/orderable-document-list`** (pinned to `^1.5.1` for Sanity 4 compatibility; 2.x requires Sanity 5+). Grid adjacency (which `half` cards pair) is an art-direction decision, so editors need drag-reorder. The alternative was a numeric field (clunky) or auto-ordering by year (no control).

**`workIndex` singleton** holds the page's `heroHeading` + `allWorkHeading`, registered like `homepage`. Copy is editable rather than hardcoded; the page falls back to defaults if the singleton is empty.

**Reversibility**: medium. The new fields and `orderRank` live on stored content, so changing the model (e.g. collapsing `cardSize` to layout-derived, or splitting the shared `Card`) is a code change plus, for `tags`/`orderRank`, a content concern. The `workIndex` singleton and shared `Card` are low-cost to revert.
