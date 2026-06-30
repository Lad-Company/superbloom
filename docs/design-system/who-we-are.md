# Who We Are

> Art-directed narrative page introducing Superbloom's mission, team stats, disciplines, and Creative Collective.

- **Figma (R3):** [node 4394-1779](https://www.figma.com/design/PgQyJQIoLqIfoWnJtU0MTh/-i--Superbloom---R3?node-id=4394-1779&m=dev)
- **Maps to:** `apps/web/src/pages/who-we-are.astro` · singleton `whoWeAre`
- **Route:** `/who-we-are`

## Section anatomy (fixed order)

| # | Name | Component | CMS fields | Theme |
|---|------|-----------|------------|-------|
| 1 | Nav | `Nav.astro` | — | dark |
| 2 | Hero | inline `<h1>` | `heroHeading` | dark |
| 3 | Featured media | inline video/image | `featuredMedia{media,aspectRatio,theme}` | editor-selectable (default blue) |
| 4 | Marquee | `Marquee.astro` | `marquee{text,theme}` | editor-selectable (default green) |
| 5 | Intro statement | inline `<p>` | `introStatement` | dark |
| 6 | Stat cards | `StatCards.astro` | `statCards[]{label,value,description,items[],theme}` | per-card (editor-selectable) |
| 7 | Advantage headline + blocks | `TextMedia.astro` | `advantageHeadline`, `advantageBlocks[]{heading,body,media,aspectRatio}` | dark |
| 8 | Disciplines list | `DisciplineList.astro` | `disciplines[]{title,description}` | dark |
| 9 | 2-up CTAs | `TwoUp.astro` | `ctas[]{heading,label,href,media}` (max 2) | dark |
| 10 | FAQ | `Faq.astro` | `faqs[]{question,answer}` (max 6) | dark |
| 11 | Contact | `ContactBlock.astro` | — (existing block) | blue |
| 12 | Footer | `Footer.astro` | — | dark |

## Domain language

This page is one of three fixed art-directed layouts (ADR-0009). It covers **Team Members** and the **Creative Collective** at a narrative level — no people grid appears here. Individual Team Member and Creator listing pages are a future scope item.

The **Disciplines** list (what Superbloom does) is a bespoke `disciplines[]` field, distinct from the `Capability` taxonomy (the 5 named service offerings). See `CONTEXT.md` for definitions.

## Theming

Brand hue roles `blue/green/pink/purple` (ADR-0013 + ADR-0010 amendment) are first used here. Green `#99a224` is the same Superbloom brand green as the Zine block. Stats cards carry an editor-selectable role per card; band sections (featured media, marquee) carry a per-section role. See `Section.astro` for resolved `--bg`/`--fg` values.

## Motion deferred

- Marquee: CSS `animation` in place; GSAP scroll-synced version deferred.
- FAQ accordion: native `<details>` open/close; animated transition deferred.

## Implementation status / gaps

Spec implemented as a tracer. Content-authoring backlog:

- Author `heroHeading`, `introStatement`, `statCards[]` (Founded/Team/Clients), `advantageBlocks[]`, `disciplines[]`, `ctas[]`, `faqs[]` in Studio.
- Supply `featuredMedia` video/image asset once sourced ("Need to discuss asset/video" annotation in R3).
- `TwoUp` CTA `href` values are `#` until target pages exist.
