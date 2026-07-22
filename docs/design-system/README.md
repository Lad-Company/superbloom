# Design System

Content-contract notes for named modules in the approved July 2026 Figma
screens. The current Index composition authority is
[SBH Temp node 1:4790](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4790&m=dev).
Older linked screens remain evidence where the current composition
specification does not replace them.

Use [design-language.md](./design-language.md) for visual rules and component
boundaries. These module docs define content responsibilities and authoring
constraints only. They are not a substitute for Figma visual evidence and do not
authorize implementation changes.

| Component | Figma | Maps to | Status |
| --- | --- | --- | --- |
| [CMS Content Composition](./cms-content-composition-spec.md) | [Index](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4790&m=dev) | Content Card · Content Layout Row · shared CMS contracts | Approved for issue decomposition |
| [Work Index](./work-index.md) | [Current composition](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4790&m=dev) | `/work` · `caseStudy` | Redesign specified |
| [Case Study](./case-study-spine-implementation-spec.md) | [Case Study](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-87&m=dev) | `/work/[slug]` · Case Study Spine | Composition update specified |
| [Who We Are](./who-we-are.md) | [Who We Are](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-245&m=dev) | `/who-we-are` | Implemented |
| [Index Page](./index-page.md) | [Index](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4790&m=dev) | `/index` · News + Editorial + Zine Articles | Redesign specified |
| [Article Detail historical spec](./editorial-index-and-article-implementation-spec.md) | [Article Detail](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-652&m=dev) | `/news/[slug]`, `/articles/[slug]`, `/zine/issues/[...]/[slug]` | Superseded by CMS composition spec |
| [Zine](./zine-implementation-spec.md) | [Zine](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-500&m=dev) | `/zine`, `/zine/issues/[slug]` | Current companion contract |
| [Home-Hero](./home-hero.md) | [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev) | `heroBlock` | Partially implemented, gaps documented |
| [Home-Zine](./home-zine.md) | [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev) | `homeZine` block | Ready for implementation |
| [Capes](./capes.md) | [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev) | `capesBlock` · `capability` | Partially implemented, gaps documented |
| [Shop](./shop-functional-implementation-spec.md) | None (visual design deferred) | `/shop`, `/shop/products/[handle]`, `/cart` | Ready for implementation (functional only) |
| [2-up](./2-up.md) / [Crosslink](./crosslink.md) | Current page screens | fixed-template composition | Documented |
| [FAQ](./faq.md) / [FAQ Item](./faq-item.md) | [Who We Are](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-245&m=dev) | `whoWeAre.faqs[]` | Documented |
| [Tag](./tag.md) | Current page screens | `TagList` · `tag` taxonomy | Documented |
| [Card Carousel](./news-carousel.md) / [Content Card](./news-card.md) | Current page screens | Content-specific adapters | Redesign specified |
| [MVP Completion](./mvp-completion-implementation-spec.md) | Various | Forms, SEO, Shell, Observability, QA | Ready for implementation |

## Implementation specs

Full implementation specifications with schema, queries, components, tests, and acceptance criteria:

- [CMS Content Composition](./cms-content-composition-spec.md), approved for issue decomposition
- [Case Study Spine](./case-study-spine-implementation-spec.md), composition update specified
- [Zine](./zine-implementation-spec.md), current companion contract
- [Shop (functional)](./shop-functional-implementation-spec.md), ready for implementation (visual design deferred)
- [MVP Completion](./mvp-completion-implementation-spec.md), ready for implementation

## Related architectural plans

- [Editorial refactor plan](./editorial-refactor-plan.md), superseded historical plan
- [Design language](./design-language.md), visual rules, primitives, composition boundaries
