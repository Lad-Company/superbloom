# Home-Hero

> Full-bleed hero: background media with an overlaid headline and intro line.

- **Figma:** [node 6119-1284](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6119-1284&m=dev)
- **Maps to:** `apps/web/src/components/blocks/Hero.astro` · schema: `heroBlock` · used by `homepage.sections[]`

## Description

A full-bleed hero — background media with an overlaid headline and intro line.
The headline is set in PP Neue Corp (`H1`); the intro is a short Graphik line
sitting bottom-right of the headline.

## Fields

- Headline*
- Intro*
- Media* — image or video

_Fields marked with an asterisk are required._

## Behavior

- Media fills the frame; headline and intro overlay it, anchored to the bottom.
- Headline occupies the left ~2/3; the intro sits in the right column, bottom-aligned.

### Responsive

- **Desktop (1440):** background media is roughly 3:2; content uses a 3-column grid
  (headline spans cols 1–2, intro in col 3). Headline `H1` ~200px. Page margin 32px.
- **Mobile (375):** media is a tall 375:667 frame; headline and intro stack in a
  single column anchored bottom. Headline `H1` mobile ~72px. Page margin 12px.

## Implementation status / gaps

`Hero.astro` and `heroBlock` are largely in place, with these divergences:

- **Intro required:** the spec marks Intro* required, but `heroBlock.subheading`
  is optional and `Hero.astro` renders it conditionally.
- **Media = image or video:** the spec allows an image *or* video; `heroBlock`
  only has a Mux `video` field and `Hero.astro` only renders a video background.
  No image fallback/option is modeled.
- **Naming:** spec "Headline" = schema `heading`; spec "Intro" = schema `subheading`.
- **Media required:** spec marks Media* required; `heroBlock.video` is optional
  (the component renders with no background if absent).
