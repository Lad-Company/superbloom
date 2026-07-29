# Code Drift

Places where the code diverges from the intended architecture, surfaced during the
July 2026 documentation audit. These are deadweight or mismatches to resolve in
code, not in docs. The design docs (`docs/design-system.md`, `ARCHITECTURE.md`,
`CONTEXT.md`) describe intended architecture; this file tracks the gaps.

When you fix one, delete its entry.

## Deadweight (unwired code)

- **`homeFeatureBlock` — dead schema + component.** The schema
  (`packages/schemas/src/homeFeatureBlock.ts`) is not registered in
  `packages/schemas/src/index.ts`, and `apps/web/src/components/blocks/HomeFeature.astro`
  is imported nowhere. Remove both, or wire the "Home-Why" text-media block into
  `homepage` if it's still wanted (see `docs/design-system.md` §6).
- **`homeTestimonialsBlock` — orphaned schema + component.** Registered in
  `index.ts` but not used by `homepage.ts`, and
  `apps/web/src/components/blocks/HomeTestimonials.astro` is imported nowhere.
  Remove or wire in.
- **Leftover motion prototype.** `apps/web/src/pages/prototype/motion.astro` and
  `apps/web/src/components/prototype/MotionLanguagePrototype.astro` remain; the
  motion work's "remove the prototype route" step was never completed.

## Schema / component mismatches

- **Content Layout Row block count.** `packages/schemas/src/contentLayoutRow.ts`
  allows 1–3 blocks and includes a `contentLayoutSpacer` type; earlier docs
  specified 1–2 Media/Text blocks only. Confirm the spacer + max-3 was intended and
  reconcile the doc (`docs/design-system.md` §3) or the schema.
- **Unused `tag.color`.** `packages/schemas/src/tag.ts` defines a `color` (hex)
  field that `apps/web/src/components/*TagList*` never renders. Remove the field or
  use it.
- **Marquee font token.** `apps/web/src/styles/tokens.css` sets `--font-marquee` to
  "PP Neue Corp Compact", while the design language says the Who We Are marquee uses
  PP Neue Corp Condensed/Wide. Reconcile the token with the intended faces.
