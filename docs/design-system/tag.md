# Tag

> A small pill label presenting editorial taxonomy in overlay or inline context.

- **Figma:** [node 6216-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6216-1279&m=dev) (documented as "Case Study Hero — Elements")
- **Maps to:** no dedicated component yet; rendered inline as the capability pills in
  Case Study Hero (`work/[slug].astro`). Source data: `capability.title`.

## Description

A small pill label — used to tag content (capability, category). Outlined pill with
an uppercase PP Neue Corp `Label`.

## Usage

- Use to present Tags in editorial-card metadata.
- Keep labels to 1–2 words.

## Notes

- States: **Default** (outline) and **Hover** (filled).
- Label set per instance.
- Viewport-agnostic — same at all sizes.
- Inherits page color mode (light / dark) via `--fg` / `--bg`.

## Implementation status / gaps

- **Boundary:** `TagList` owns overlay and inline presentation contexts. A Tag is
  editorial taxonomy, while Case Study Capabilities are a separate taxonomy.
- Hover (filled) state is not implemented anywhere.
