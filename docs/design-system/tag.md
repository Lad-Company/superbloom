# Tag

> A small pill label presenting editorial taxonomy in overlay or inline context.

- **Figma:** [node 6216-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6216-1279&m=dev) (documented as "Case Study Hero — Elements")
- **Maps to:** shared `tag` taxonomy and the label cluster owned by `MediaFrame`.
- **Complete card contract:** [CMS Content Composition implementation specification](./cms-content-composition-spec.md)

## Description

A small pill label used for optional editorial taxonomy. A Tag is distinct from
a Capability, Deliverable, or required Article Type badge.

## Usage

- Use to present Tags in editorial-card metadata.
- Keep labels to 1–2 words.
- Articles and Case Studies may have zero to two Tags.
- Mixed Article lists show the required Type badge followed by at most one Tag.
- Type-specific Article lists hide the Type badge and may show up to two Tags.
- Case Study cards show up to two Tags and no Type badge.
- Card labels stay at the media-frame top-left.

## Notes

- States: **Default** (outline) and **Hover** (filled).
- Label set per instance.
- Viewport-agnostic — same at all sizes.
- Inherits page color mode (light / dark) via `--fg` / `--bg`.

## Implementation status / gaps

- **Boundary:** the Content Card adapter supplies the Type badge and Tags;
  `MediaFrame` owns their top-left presentation. Tags remain reusable editorial
  taxonomy, while Case Study Capabilities are separate.
- Hover (filled) state is not implemented anywhere.
