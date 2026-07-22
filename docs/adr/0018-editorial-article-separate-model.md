# Editorial Article as a separate content model

> **Status: Fully superseded by ADR-0020.**
>
> The separate authored document models decided here are no longer current. News, Editorial, and Zine use one `article` document with a required hidden `articleType` discriminator. Separate Studio views and create actions preset and hide the discriminator, while distinct routes and content adapters preserve each editorial identity. Index includes all three Article types.
>
> The text below is retained only as historical rationale. Do not use it as implementation guidance. See ADR-0020 and `docs/design-system/cms-content-composition-spec.md`.

## Historical record

Editorial Article is a standalone long-form content type distinct from News, even though both models share much of their schema and rendering. Editors choose between News and Editorial Article based on editorial intent rather than an enforced semantic rule. This preserves editorial flexibility while maintaining the CONTEXT.md glossary distinction.

**Why a separate model**: The team's mental model treats News and Editorial Articles as different publication types with different editorial purposes. News is press, announcements, and coverage of Superbloom; Editorial Articles are standalone long-form editorial pieces. While they share the same Article Detail presentation, body schema, and Index Page appearance, they remain distinct authored types in Sanity Studio. This separation respects the glossary and gives editors clear type choices without forcing a technical discriminator field.

**Why not a discriminator**: A `kind` field (`news` vs `article`) would collapse two distinct mental models into one document type. It would confuse the Studio interface, make queries less clear, and blur the CONTEXT.md vocabulary. The shared rendering is an implementation detail; the editorial distinction is a domain requirement.

**Schema overlap**: Both models share:
- required `title`, `slug`, `publicationDate`
- required `overview` (Portable Text)
- ordered `body[]` using `articleTextSection` and `articleMediaSection`; required for Editorial Articles and optional for News
- optional `tags` (max 2, shared `tag` taxonomy that also covers Case Studies and Zine Articles)
- optional `relatedItems` (curated only, accepts News, Editorial Articles, and Zine Articles, zero or exactly three, excludes the current item)
- `cardMedia` and `cardAspectRatio` for Index Page cards

News retains its unique `externalCoverage` array for outlet links and an editor-selected card destination. An externally targeted News card opens its explicitly selected primary coverage link in a new tab; its internal detail route remains available. Editorial Articles have no additional unique fields in MVP scope. The signed designs provide no byline treatment, so none of the three article-like types adds author fields in MVP.

**Index Page behavior**: Both types appear together on `/index` in one reverse-chronological feed by publication date. The Index Page query unions both document types. Cards adapt content metadata but use the same `EditorialCard` composition.

**Article Detail**: News, Editorial Articles, and Zine Articles use a shared Article Detail presentation module. News routes to `/news/[slug]`; Editorial Articles route to `/articles/[slug]`; Zine Articles use their nested Issue route. The component accepts a discriminated union and conditionally renders type-specific supporting content.

**Considered options**: one composite News model with optional body; one model with `kind` discriminator; completely separate models with duplicated schema.

**Reversibility**: medium. The separation lives in stored content types, but the shared schema contracts and rendering mean merging them later requires only a content migration and query union changes, not a full rendering rewrite.
