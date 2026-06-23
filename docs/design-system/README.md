# Design System

Component specifications derived from the Figma library
([Superbloom Library](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library)).

Each documented component has its own file mirroring the Figma documentation spine
(Description / Fields / Behavior), plus a "Maps to" line and an implementation
status / gaps note. These docs are the design source of truth; they describe
intent and are kept docs-only — they do not modify schemas or components. Gaps
between a spec and the current code are recorded per file as a backlog.

| Component | Figma | Maps to | Status |
| --- | --- | --- | --- |
| [All Work](./all-work.md) | [node 6324-1308](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6324-1308&m=dev) | `apps/web/src/pages/work/index.astro` · `caseStudy` | Spec + decisions recorded; implementation is a tracer stub |
| [Home-Hero](./home-hero.md) | [node 6119-1284](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6119-1284&m=dev) | `apps/web/src/components/blocks/Hero.astro` · `heroBlock` | Spec documented; largely implemented, minor gaps |
| [Case Study Hero](./case-study-hero.md) | [node 6214-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6214-1279&m=dev) | `apps/web/src/pages/work/[slug].astro` · `caseStudy` | Decided: replace meta row with eyebrow + cape tags |
| [Tag](./tag.md) | [node 6216-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6216-1279&m=dev) | none yet (capability pills) · `capability` | Spec documented; no shared component |
| [News Carousel](./news-carousel.md) | [node 6242-1308](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6242-1308&m=dev) | none yet · homepage | Decided: build News type; unbuilt |
| [News Card](./news-card.md) | [node 6243-1308](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6243-1308&m=dev) | none yet (shared card) | Decided: dedicated tags + optional card size; unbuilt |
| [Text Media 50-50](./text-media-50-50.md) | [node 6251-1308](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6251-1308&m=dev) | partial: `MediaSection` (textAndMedia) · homepage | Decided: shared `.d1-button`; unbuilt as homepage block |
| [Capes](./capes.md) | [node 6062-1284](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6062-1284&m=dev) | `apps/web/src/components/blocks/Capes.astro` · `capesBlock` | Decided: Figma grid canonical; update `Capes.astro` to match |
| [2-up](./2-up.md) | [node 6182-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6182-1279&m=dev) | none yet | Decided: shared `.d1-button`; unbuilt |
| [Crosslink](./crosslink.md) | [node 6183-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6183-1279&m=dev) | none yet (card in 2-up) | Decided: shared `.d1-button`; unbuilt |
| [FAQ](./faq.md) | [node 6158-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6158-1279&m=dev) | none yet | Spec documented; unbuilt |
| [FAQ Item](./faq-item.md) | [node 6161-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6161-1279&m=dev) | none yet (row in FAQ) | Spec documented; unbuilt |
| [Home-Zine](./home-zine.md) | [node 6133-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6133-1279&m=dev) | none yet · homepage | Decided: build Zine type + named green token + shared `.d1-button` |
