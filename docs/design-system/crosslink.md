# Crosslink
Description

A media card with a headline and a link button — a strong image (square), a
semantic display heading, and a controlled `Button` CTA.
- **Maps to:** no dedicated component yet; the single card used by
  [2-up](./2-up.md).

## Description

A media card with a headline and a link button — a strong image (square), a
semantic display heading, and a `Button` CTA.

## Fields

- Media*
- Headline*
- Button* (label + link)

_Fields marked with an asterisk are required._

## Usage

- Use to cross-link to a related page or section.
- Pair a strong image with a short headline.

### Responsive

- **Desktop (1440):** ~480px wide card; headline `H5` 56px; 1:1 media.
- **Mobile (375):** ~327px wide card; headline `H5` 32px.

## Implementation status / gaps

Unbuilt. This is the atomic unit of [2-up](./2-up.md) (which is two Crosslinks).
Composes `MediaFrame` (square, optional overlay tags and media controls) with the
approved `Button` primitive. Recommend building Crosslink as one component and
composing 2-up from it. No schema models a "crosslink" (media + headline +
button-with-link) today.
