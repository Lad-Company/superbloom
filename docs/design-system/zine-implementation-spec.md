# Zine implementation specification

**Status:** Current companion contract

**Authority:** [CMS Content Composition implementation specification](./cms-content-composition-spec.md)

**Design source:** [Zine](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-500&m=dev), [Article Detail](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-652&m=dev), [Homepage Zine promo](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-374&m=dev)

## Purpose

Record the Zine-specific contract without duplicating shared Article, Content Card, Content Layout Row, tag, responsive, migration, or testing rules. The authoritative CMS composition specification governs all shared behavior and resolves any conflict with this document.

This document describes required behavior. It does not claim that the implementation is complete.

## Zine Issue contract

A Zine Issue requires:

- a title and unique slug
- an ordered `articles` array with at least one reference
- references only to shared Article documents whose `articleType` is `zine`
- exactly one reading format: `issuuUrl` or `pdfAsset`

`issuuUrl` keeps the Studio title `ISSUU Flipbook URL` and renders as an embed. `pdfAsset` renders a fixed **Read the Zine** CTA. Editors cannot configure that PDF CTA label. An Issue must not provide both formats or neither format.

The following Issue fields are obsolete and must be removed rather than treated as current authoring fields: `coverAspectRatio`, `coverMedia`, `introHeadline`, `introText`, `issueNumber`, and Issue-level `publicationDate`.

## Membership and publication

The Issue's ordered `articles` array is the sole relationship for Zine Article membership and order. Do not duplicate Issue membership on Article documents.

A Zine Article may be published only when exactly one Issue references it. Issue authoring warns when an Article is already referenced by another Issue, and the prelaunch audit blocks cutover when a published Zine Article has zero or multiple Issue references.

Shared Zine Article fields, body composition, card settings, badges, related items, and publication date follow the unified Article contract in the authoritative specification.

## Landing, archive, and routes

The `zineLanding` singleton selects the current Issue shown at `/zine`.

- `/zine` renders the current Issue.
- `/zine/issues/[issue-slug]` renders a non-current archive Issue.
- A current Issue archive URL temporarily redirects to `/zine` and is excluded from the sitemap.
- `/zine/issues/[issue-slug]/[article-slug]` resolves an Article only through that Issue's ordered membership.

Issue presentation may include the signed-off Editor Letter, article list, Past Issues, and the configured ISSUU embed or PDF CTA. The Zine Article list is type-specific, so it hides the type badge and may show up to two Tags as defined by the authoritative specification.

## Homepage promotion

The homepage Zine promotion explicitly references an Issue and may own promotion-specific headline, intro, media, and CTA copy. It does not establish Article membership and does not have to mirror the current Issue.

## Cutover

Prelaunch destructive replacement and manual content re-entry are allowed. Take a Sanity dataset snapshot first. Use only a narrow cleanup for obsolete Zine Issue fields; do not add a broad compatibility layer.

Validation, implementation sequencing, query requirements, Content Card behavior, Content Layout Row behavior, accessibility, responsive behavior, and acceptance criteria are defined by the authoritative CMS composition specification.
