# Design System

Content-contract notes for named modules in the approved
[July 2026 Figma screens](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share).

Use [design-language.md](./design-language.md) for visual rules and component
boundaries. These module docs define content responsibilities and authoring
constraints only. They are not a substitute for Figma visual evidence and do not
authorize implementation changes.

| Component | Figma | Maps to | Status |
| --- | --- | --- | --- |
| [Work Index](./work-index.md) | [Our Work](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-367&m=dev) | `/work` · `caseStudy` | Implemented |
| [Case Study](./case-study-spine-implementation-spec.md) | [Case Study](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-87&m=dev) | `/work/[slug]` · Case Study Spine | Implemented |
| [Who We Are](./who-we-are.md) | [Who We Are](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-245&m=dev) | `/who-we-are` | Implemented |
| [Index Page](./index-page.md) | [Index](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-600&m=dev) | `/index` · News + Editorial Articles | Ready for implementation |
| [Article Detail](./editorial-index-and-article-implementation-spec.md) | [Article Detail](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-652&m=dev) | `/news/[slug]`, `/articles/[slug]`, `/zine/issues/[...]/[slug]` | Ready for implementation |
| [Zine](./zine-implementation-spec.md) | [Zine](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-500&m=dev) | `/zine`, `/zine/issues/[slug]` | Ready for implementation |
| [Home-Hero](./home-hero.md) | [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev) | `heroBlock` | Partially implemented, gaps documented |
| [Home-Zine](./home-zine.md) | [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev) | `homeZine` block | Ready for implementation |
| [Capes](./capes.md) | [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev) | `capesBlock` · `capability` | Partially implemented, gaps documented |
| [Shop](./shop-functional-implementation-spec.md) | None (visual design deferred) | `/shop`, `/shop/products/[handle]`, `/cart` | Ready for implementation (functional only) |
| [2-up](./2-up.md) / [Crosslink](./crosslink.md) | Current page screens | fixed-template composition | Documented |
| [FAQ](./faq.md) / [FAQ Item](./faq-item.md) | [Who We Are](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-245&m=dev) | `whoWeAre.faqs[]` | Documented |
| [Tag](./tag.md) | Current page screens | `TagList` · `tag` taxonomy | Documented |
| [Card Carousel](./news-carousel.md) / [News Card](./news-card.md) | Current page screens | `EditorialCard` adapters | Documented |
| [MVP Completion](./mvp-completion-implementation-spec.md) | Various | Forms, SEO, Shell, Observability, QA | Ready for implementation |

## Implementation specs

Full implementation specifications with schema, queries, components, tests, and acceptance criteria:

- [Case Study Spine](./case-study-spine-implementation-spec.md) — ✅ Implemented
- [Editorial Index and Article Detail](./editorial-index-and-article-implementation-spec.md) — Ready for implementation
- [Zine](./zine-implementation-spec.md) — Ready for implementation
- [Shop (functional)](./shop-functional-implementation-spec.md) — Ready for implementation (visual design deferred)
- [MVP Completion](./mvp-completion-implementation-spec.md) — Ready for implementation

## Related architectural plans

- [Editorial refactor plan](./editorial-refactor-plan.md) — Component architecture migration plan
- [Design language](./design-language.md) — Visual rules, primitives, composition boundaries
