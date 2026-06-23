# Tag

> A small pill label, used to tag content (capability, category).

- **Figma:** [node 6216-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6216-1279&m=dev) (documented as "Case Study Hero — Elements")
- **Maps to:** no dedicated component yet; rendered inline as the capability pills in
  Case Study Hero (`work/[slug].astro`). Source data: `capability.title`.

## Description

A small pill label — used to tag content (capability, category). Outlined pill with
an uppercase PP Neue Corp `Label`.

## Usage

- Use to tag capabilities or categories.
- Keep labels to 1–2 words.

## Notes

- States: **Default** (outline) and **Hover** (filled).
- Label set per instance.
- Viewport-agnostic — same at all sizes.
- Inherits page color mode (light / dark) via `--fg` / `--bg`.

## Implementation status / gaps

- **No reusable Tag component** exists yet. Not to be confused with `.d1-label`
  (the blurred translucent-white pill overlaid on media in News/Work cards) — Tag is
  a bordered, theme-inheriting pill.
- When built, it should be a shared component (capability tags in Case Study Hero,
  and likely the Work card tags) driven by `capability.title`.
- Hover (filled) state is not implemented anywhere.
