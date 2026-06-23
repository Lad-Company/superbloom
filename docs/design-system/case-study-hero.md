# Case Study Hero

> A full-bleed case study hero on the case study's brand color: client eyebrow, a large headline, and capability tags.

- **Figma:** [node 6214-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6214-1279&m=dev)
- **Maps to:** the `.hero` section in `apps/web/src/pages/work/[slug].astro` · schema: `caseStudy` (`client`, `title`, `capabilities`, `primaryColor`)

## Description

A full-bleed case study hero — a client eyebrow, a large headline, and capability
tags, set on the case study's brand color. No background media; the brand color is
the backdrop.

## Fields

- Eyebrow* (client)
- Headline*
- Tags — up to 6 (capabilities)
- Background color*

_Fields marked with an asterisk are required._

## Behavior

- Background = the case study's brand color, set per case study (not a fixed token
  and not a light/dark mode). Foreground auto-derives for contrast (see
  ADR-0010 / `Section` theming).
- Tags render as outlined pills below the headline and wrap to multiple rows.

### Responsive

- **Desktop (1440):** client eyebrow `H5` ~56px; headline at the display `H1` ~200px;
  tags in a wrapping row. Page margin 32px, top padding ~160px.
- **Mobile (375):** eyebrow `H5` 32px; headline `H1` 72px; tags wrap full width.
  Page margin 12px, top padding ~96px.

## Implementation status / gaps

The `.hero` in `work/[slug].astro` already themes off `primaryColor` with
auto-derived foreground, and renders `cs.title` as the headline. Divergences:

- **Eyebrow (client):** spec puts the **client** name as the eyebrow above the
  headline. `caseStudy.client` exists but the current hero does not render it as an
  eyebrow.
- **Tags = capabilities (up to 6):** spec shows capability tags under the headline.
  **Decided: the current meta row (Year / Industry / Deliverables / Creative
  Collective) is replaced by the client eyebrow + capability tags.** Tags source is
  `caseStudy.capabilities` (references), rendered as the Cape/Tag pills.
- **Background color:** maps to `caseStudy.primaryColor` — implemented.
- **Headline:** maps to `caseStudy.title` — implemented.
