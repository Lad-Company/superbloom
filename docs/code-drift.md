# Code Drift

Places where the code diverges from the intended architecture, surfaced during the
July 2026 documentation audit. These are deadweight or mismatches to resolve in
code, not in docs. The design docs (`docs/design-system.md`, `ARCHITECTURE.md`,
`CONTEXT.md`) describe intended architecture; this file tracks the gaps.

When you fix one, delete its entry.

## Schema / component mismatches

- **Content Layout Row block count.** `packages/schemas/src/contentLayoutRow.ts`
  allows 1–3 blocks and includes a `contentLayoutSpacer` type; earlier docs
  specified 1–2 Media/Text blocks only. Confirm the spacer + max-3 was intended and
  reconcile the doc (`docs/design-system.md` §3) or the schema.
- **Unused `tag.color`.** `packages/schemas/src/tag.ts` defines a `color` (hex)
  field that `apps/web/src/components/*TagList*` never renders. Remove the field or
  use it.
