# Editorial Index and Article Detail implementation specification

**Status:** Superseded historical record

**Superseded by:** [CMS Content Composition implementation specification](./cms-content-composition-spec.md)

**Historical decision sources:** [ADR-0018](../adr/0018-editorial-article-separate-model.md), [ADR-0011](../adr/0011-news-content-model.md)

**Historical design sources:** [Index Page](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-600&m=dev), [Article Detail](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-652&m=dev)

## Historical purpose

This document previously proposed the Index Page and Article Detail using separate News and Editorial Article schemas, a fixed featured composition, legacy card settings, and dedicated text and media body sections.

Those implementation instructions are retired. They remain summarized here only to explain the earlier direction and must not be used as an actionable checklist or data contract.

## Current authority

The unified CMS composition specification now governs:

- the shared `article` document and `articleType` discriminator
- Index Featured and All section membership and layout
- Content Card settings, inheritance, tags, and badges
- Content Layout Rows for Article bodies
- progressive pagination and batch ownership
- routes, validation, cutover, testing, and implementation sequencing

The earlier intent to support internal and external News destinations, zero or three related items, semantic publication dates, baseline Load More behavior, keyboard access, and visible focus is incorporated into the current specification.

Do not infer implementation completion from this historical record.
