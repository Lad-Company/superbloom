# News modeled as a single composite content type

News is a single `news` document type that composes both halves of its definition: an optional internal `body[]` (Superbloom's own writeup, built from the shared body blocks) and an optional array of external links (`{ outlet, url }`) to outside coverage. Every News item has its own detail page, and a News Card always links to that page; external links are surfaced within it. A News item may therefore be a self-published article, an external press mention, or both at once.

**Why one composite type over a discriminated union**: the team's mental model is that a News item is *one unit* — Superbloom writes a piece and also points to where the story was picked up, displayed together. Splitting into `article` vs `mention` sub-types (or a `kind` discriminator) would force an either/or that contradicts that model and complicate the feed query and the Studio.

**Why not overload `caseStudy`**: `CONTEXT.md` keeps News and Case Study deliberately distinct. A Case Study is a documented work engagement that lives in Work, requires at least one Capability, and follows a fixed narrative spine (Highlights / Challenge / Solution / Outcomes / Press / Related Work). News has none of those constraints. Overloading `caseStudy` would surface News in the Work index query, force an irrelevant required Capability, and blur the glossary. The reuse we keep instead is the **body-block rendering infrastructure** (`textSection`/`mediaSection`/etc. via `CaseBodyBlock` + `Section`), which a News article composes without being a Case Study.

**Tags as a taxonomy**: the card pills (`.d1-label`) are sourced from a dedicated `tag` document (title / slug / description / color), referenced by `news.tags` (max 2) — not reused from `capabilities`/`deliverables`. This reserves the glossary term **Tag** for a free editorial label, distinct from the capability-sourced bordered pill in the Case Study Hero.

**Considered options**: overload `caseStudy`; two top-level document types (`newsArticle` + `newsMention`); one type with a `kind` discriminator (article XOR mention); one composite type holding both internal body and external links.

**Reversibility**: medium. The composite shape and the `tag` taxonomy live on stored content, so changing the model later (e.g. splitting sub-types or collapsing tags to strings) means a content migration.
