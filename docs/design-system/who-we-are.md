# Who We Are

> Art-directed narrative page introducing Superbloom's mission, team stats, disciplines, and Creative Collective.

- **Figma:** [Who We Are](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-245&m=dev)
- **Maps to:** `apps/web/src/pages/who-we-are.astro` · singleton `whoWeAre`
- **Route:** `/who-we-are`

## Section anatomy (fixed order)

| # | Name | Component | CMS fields | Theme |
|---|------|-----------|------------|-------|
| 1 | Nav | `Nav.astro` | — | dark |
| 2 | Hero | inline `<h1>` | `heroHeading` | dark |
| 3 | Featured media | inline video/image | `featuredMedia{media,aspectRatio}` | template-owned |
| 4 | Marquee | `Marquee.astro` | `marquee{text}` | template-owned |
| 5 | Intro statement | inline `<p>` | `introStatement` | dark |
| 6 | Fact cards | `FactCardGrid` | `statCards[]{label,value,description,items[]}` | template-owned |
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

Template-owned semantic Surface Roles map the page palette. Editors do not select
hue-named values. The marquee is the sole `MarqueeDisplay` exception that may use
PP Neue Corp Condensed and Wide.

## Motion deferred

- No existing motion implementation is design-system precedent. Motion behavior is
  deferred to the dedicated prototype session.

## Implementation status / gaps

Spec implemented as a tracer. Content-authoring backlog:

- Author `heroHeading`, `introStatement`, `statCards[]` (Founded/Team/Clients), `advantageBlocks[]`, `disciplines[]`, `ctas[]`, `faqs[]` in Studio.
- Supply the featured-media asset once sourced.
- `TwoUp` CTA `href` values are `#` until target pages exist.
