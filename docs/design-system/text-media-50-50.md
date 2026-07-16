# Text Media 50-50

> A text + media split: headline, body, and CTA beside a featured media card.

- **Figma:** [node 6251-1308](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6251-1308&m=dev) (source component named "Home-Why")
- **Maps to:** unbuilt as a homepage block; partially overlaps the `textAndMedia`
  layout of `mediaSection` / `MediaSection.astro`. Belongs in `homepage.sections[]`.

## Description

A text + media split — a headline, body, and CTA on one side, a featured media card
(4:5) on the other.

## Fields

- Headline*
- Body*
- CTA (label + link)
- News Card (featured media)

_Fields marked with an asterisk are required._

## Behavior

- Inherits page color mode (light / dark) via `--fg` / `--bg`.

### Responsive

- **Desktop (1440):** two columns side by side; text left, media right (~676px).
  Headline `H4` 80px, body `H7` 24px. Page margin 32px, gutter 24px.
- **Mobile (375):** stacks to a single column (text then media). Headline `H4` 40px,
  body `H7` 20px. Page margin 12px.

## Implementation status / gaps

Unbuilt as a homepage block. Overlaps but does not match existing pieces:

- **vs `mediaSection` (`textAndMedia`):** that layout pairs portable-text `text`
  with media but has **no headline and no CTA**, and lives in a Case Study `body[]`,
  not the homepage. This section needs a Headline (`H4`), Body, and a CTA
  (label + link).
- **No homepage text/media block.** `homepage.sections[]` accepts only `heroBlock`,
  `capesBlock`, `contactBlock`. A new block type would be required.
- **CTA:** use the approved `Button` primitive. Its variant follows the composed
  Surface Role.
- The media is a `MediaFrame` with a 4:5 ratio; tags are optional.
