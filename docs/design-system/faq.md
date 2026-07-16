# FAQ

> An expandable list of questions and answers.

- **Figma:** [node 6158-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6158-1279&m=dev)
- **Maps to:** unbuilt — no schema or component.

## Description

An expandable list of questions and answers, with a large "FAQ" section heading
beside an accordion of items.

## Fields

- Heading*
- FAQ item (up to 6)
  - Question*
  - Answer*

_Fields marked with an asterisk are required._

## Behavior

- Tap a question to expand its answer; the `+` icon becomes a `−` when open.
- Inherits page color mode (light / dark) via `--fg` / `--bg`.

### Responsive

- **Desktop (1440):** two columns — heading `H4` 80px on the left, accordion (~677px)
  on the right. Each item is a hairline-topped row, question `H7` 24px, 44px icon.
- **Mobile (375):** stacks — heading `H4` 40px above the accordion. Question `H7` 20px.

## Implementation status / gaps

Entirely unbuilt.

- **Who We Are model:** `whoWeAre.faqs[]` supplies a fixed-template FAQ, with
  `question` / `answer` entries (both required, up to 6).
- **Disclosure interaction** (expand/collapse, `+`/`−` toggle) is unimplemented;
  build accessibly (`<details>`/`<summary>` or button + `aria-expanded`).
- It belongs to the fixed Who We Are composition, not a general page-builder block.
