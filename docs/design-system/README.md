# Design System

Content-contract notes for named modules in the approved
[July 2026 Figma screens](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share).

Use [design-language.md](./design-language.md) for visual rules and component
boundaries. These module docs define content responsibilities and authoring
constraints only. They are not a substitute for Figma visual evidence and do not
authorize implementation changes.

| Component | Figma | Maps to | Status |
| --- | --- | --- | --- |
| [Work Index](./work-index.md) | [Our Work](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-367&m=dev) | `apps/web/src/pages/work/index.astro` · `caseStudy` | Case Study browse contract |
| [Index Page](./index-page.md) | [Index](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-600&m=dev) | future long-form index · News + Zine Articles | Long-form browse contract |
| [Home-Hero](./home-hero.md) | [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev) | `heroBlock` | Homepage hero content |
| [Case Study Hero](./case-study-hero.md) | [Case Study](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-87&m=dev) | `caseStudy` | Case Study hero content |
| [Home-Zine](./home-zine.md) | [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev) | future Zine promo | Homepage Zine promotion |
| [2-up](./2-up.md) / [Crosslink](./crosslink.md) | Current page screens | fixed-template composition | Related-content links |
| [FAQ](./faq.md) / [FAQ Item](./faq-item.md) | [Who We Are](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-245&m=dev) | `whoWeAre.faqs[]` | Fixed-page FAQ content |
| [Tag](./tag.md) | Current page screens | `TagList` · `tag` taxonomy | Editorial label presentation |
| [Capes](./capes.md) | [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev) | `capesBlock` · `capability` | Capability content |
| [Card Carousel](./news-carousel.md) / [News Card](./news-card.md) | Current page screens | `EditorialCard` adapters | Content-adapter notes |
