# Home-Zine

> Editorial block: a media card paired with a headline, intro line, and CTA label, on a fixed brand color.

- **Figma:** [Homepage](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev)
- **Maps to:** `homeZine` block · used by `homepage.sections[]` Editorial Composition
- **Implementation spec:** [zine-implementation-spec.md](./zine-implementation-spec.md)

## Description

An editorial block promoting a Zine Issue on the homepage. The block explicitly references an Issue and owns its own promo headline, intro, media, and CTA label — it does not automatically mirror the current Issue.

## Fields

- Issue reference* (explicitly selected)
- Promo headline* (custom, may differ from Issue title)
- Promo intro* (custom, may differ from Issue intro)
- Promo media* (image or video, may differ from Issue cover)
- CTA label* (e.g., "Explore Issue 01")

_Fields marked with an asterisk are required._

## Behavior

- Assigned a **fixed brand color (Green, `#99a224`)** background — does not switch with light/dark page mode
- CTA links to `/zine` or `/zine/issues/[issue-slug]` depending on whether the referenced Issue is current
- Editors choose which Issue to promote and customize the promo content

### Responsive

- **Desktop (1440):** media left, text block right (~483px) with semantic `display-3`, intro `caption`, and a `Button` CTA. Page margin 32px.
- **Mobile (375):** stacks (media, then text). Headline `H3` 48px. Page margin 12px.

## Implementation notes

- Surface Role is template-owned, not CMS-selectable
- Homepage template maps this block to the green brand palette
- CTA destination logic: if `issue.slug === zineLanding.currentIssue.slug`, link to `/zine`; otherwise `/zine/issues/[issue-slug]`
- Use existing `Button` primitive for CTA
