# News modeled as a single composite content type

> **Partially superseded:**
> - ADR-0017 replaces the shared Case Study/News Body Block rendering decision and the former Case Study spine names. Case Studies now use the fixed Case Study Spine; News retains its flexible Body Blocks.
> - ADR-0018 introduces Editorial Article as a separate content model alongside News, replaces the legacy News body block types with the shared Article Body Sections, and allows editors to target a News card either internally or at one explicitly selected primary coverage link.
> - News remains a composite content type with its own flexible Body Blocks as described below.

News is a single `news` document type that composes both halves of its definition: an optional internal `body[]` (Superbloom's own writeup, built from the shared Article Body Sections) and an optional array of external coverage links. Every News item has its own detail page. Editors separately choose whether its cards target that detail page or one primary external coverage link. A News item may therefore be a self-published article, an external press mention, or both at once.

**Why one composite type over a discriminated union**: the team's mental model is that a News item is *one unit* — Superbloom writes a piece and also points to where the story was picked up, displayed together. Splitting into `article` vs `mention` sub-types (or a `kind` discriminator) would force an either/or that contradicts that model and complicate the feed query and the Studio.

**Why not overload `caseStudy`**: `CONTEXT.md` keeps News and Case Study deliberately distinct. A Case Study is a documented work engagement that lives in Work, requires at least one Capability, and follows a fixed narrative spine (Highlights / Challenge / Unexpected Insight / Big Idea / Results / Press / Next Project). News has none of those constraints. Overloading `caseStudy` would surface News in the Work index query, force an irrelevant required Capability, and blur the glossary. The reuse we keep instead is the **body-block rendering infrastructure** (`articleTextSection`/`articleMediaSection` via `ArticleBodyRenderer`), which News composes without being a Case Study.

**Tags as a taxonomy**: the card pills (`.d1-label`) are sourced from a dedicated `tag` document (title / slug / description / color), referenced by `news.tags` (max 2) — not reused from `capabilities`/`deliverables`. This reserves the glossary term **Tag** for a free editorial label, distinct from the capability-sourced bordered pill in the Case Study Hero. Tags are shared across News, Editorial Articles, Case Studies, and Zine Articles.

**Considered options**: overload `caseStudy`; two top-level document types (`newsArticle` + `newsMention`); one type with a `kind` discriminator (article XOR mention); one composite type holding both internal body and external links.

**Reversibility**: medium. The composite shape and the `tag` taxonomy live on stored content, so changing the model later (e.g. splitting sub-types or collapsing tags to strings) means a content migration.
