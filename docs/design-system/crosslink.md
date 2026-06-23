# Crosslink

> A media card with a headline and a link button.

- **Figma:** [node 6183-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6183-1279&m=dev) (documented as "2-up — Elements")
- **Maps to:** no dedicated component yet; the single card used by
  [2-up](./2-up.md).

## Description

A media card with a headline and a link button — a strong image (square), an
uppercase `H5` headline, and a `.d1-button` CTA.

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
Reuses the shared **Media** block (square, optional overlay tags + a play `Button`
when video) and the **`.d1-button`** CTA (**decided: promote `.d1-button` to a shared
component**). Recommend building Crosslink as one component and composing 2-up from
it. No schema models a "crosslink" (media + headline + button-with-link) today.
