# News Card

**Status:** Target adapter contract; current code may still use legacy props

**Earlier Figma evidence:** [News Carousel Elements, node 6243:1308](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6243-1308&m=dev)

**Current composition authority:** [Figma nodes 1:4790 and 1:4816](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4790&m=dev)

**Complete contract:** [CMS Content Composition implementation specification](./cms-content-composition-spec.md)

`NewsCard` is the News-specific adapter for the shared Content Card
composition. It supplies News metadata and destination behavior without becoming
a universal content model.

## Adapter responsibilities

- Always provide title, overview, publication date, card media, and the resolved
  internal or external destination.
- Use the global Content Card settings: width fractions from `1/4` through
  `full`, the shared aspect-ratio list including `intrinsic`, and Info position
  `below`, `left`, or `right`.
- Resolve non-Featured settings through per-item partial override, list default,
  content default, then global default. Featured cards instead require all three
  settings explicitly.
- Render badges in the media-frame top-left. Mixed Article lists show `News`
  plus at most one Tag. Type-specific News lists hide the Type badge and may show
  up to two Tags.
- For `cardDestination: external`, link to the exactly one primary coverage URL,
  open a new tab, and show a text-and-icon indicator. The internal News detail
  remains available at `/news/[slug]`.

Content Card controls presentation. News adapter fields do not define legacy
binary sizing, inset states, or a per-card copy toggle.

On mobile, ordinary cards become full width with Info below. Cards remain narrow
only inside an explicit horizontal carousel.
