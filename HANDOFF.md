# Library R1 Page Feedback — Handoff

Mission stopped after slice **#58**. Remaining tickets (#59–#80) are to be completed manually, one at a time. This doc hands off the next incomplete ticket (#59) plus the state you need to keep going.

## Current state

- **Branch:** `library-r1` (base: `main`)
- **Committed slices:** #48–#58 (one commit each, e.g. `git log --oneline main..library-r1`)
- **Gate is green on `library-r1`:** `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass.
- **`pnpm format:check` fails on ~199 pre-existing files** — this is a known pre-existing condition, NOT part of the gate. Only run `pnpm exec prettier --write` on files you touch.
- No combined PR opened yet. Open one PR from `library-r1` → `main` at the end.

### #58 leftover (not code — human step)
`#58` is fully implemented and committed. The only outstanding item is **authoring the actual Index header copy in the Sanity CMS** (project `l9mhqdtj`, dataset `production`). No schema cleanup needed — the old "Index" text was hardcoded, not a schema field.

## Next incomplete ticket: #59 (C3) — Index sort control

- **Skill/complexity:** page-worker (medium)
- **Depends on:** nothing outstanding (index milestone)
- **Fulfills:** VAL-C3-001, VAL-C3-002
- **Files:** `apps/web/src/pages/index/index.astro` (Index list); adapter in `apps/web/src/lib/` if present. See `CONTEXT.md` "Publication Date" and `docs/.../index-page.md`.

**What to build**
- Add a large, header-sized sort control on the Index.
- Visitor can sort items by Publication Date, ascending or descending.

**Done when**
- Header-sized sort control is present on the Index.
- Sorting by Publication Date asc/desc works.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` pass; `prettier --write` run on touched files.
- Commit references `#59` (e.g. `feat(#59): ...`).

## Remaining tickets to complete 1-by-1

Full specs (description, preconditions, expectedBehavior, fulfills, blocker deps) for every remaining slice live in:
`/Users/pete/.factory/missions/998acf3c-b679-473f-992d-b8ff02797e5b/features.json`

Order (respect `Blocked by` in each GitHub issue):
- **index:** #59, #60, #61, #62
- **home:** #63, #64, #65, #66, #67
- **who-we-are:** #68, #69, #70, #71
- **shop-item:** #72, #73
- **mobile-qa:** #75, #74, #76, #78, #80, #77, #79

Excluded from scope: A6, C2, D5, E2, and the feature track. Never modify or close tracking issue **#47**.

## Per-ticket workflow

1. `gh issue view <n>` to read the slice.
2. Ground in Figma (`figma___*` MCP tools, file `qQxcXKwgY7EUJodM1Ypfr5`), `CONTEXT.md`, `docs/adr/`, and the relevant `docs/design-system/*` spec.
3. Implement in `apps/web` (and `packages/schemas` + `apps/studio` for CMS slices #65).
4. For CMS slices: edit schema, `pnpm typegen`, wire frontend, `pnpm --filter studio exec sanity deploy`, clean up superseded schema.
5. Verify: `pnpm lint && pnpm typecheck && pnpm test`; `pnpm exec prettier --write` on touched files.
6. Commit referencing the issue number.

## Key resources

- **Mission dir:** `/Users/pete/.factory/missions/998acf3c-b679-473f-992d-b8ff02797e5b/`
  - `features.json` — all slice specs
  - `architecture.md` — layer map + per-slice design intent
  - `validation-contract.md` — 68 assertions (what "done" means per slice)
  - `AGENTS.md` — boundaries, gate rules, known pre-existing issues, Figma-fallback protocol
  - `library/figma-refs.md` — pre-resolved Figma tokens/type scale + node-id↔section caveats (notably the WWA hero node `6475-8391` is a full-page frame; resolve the hero live; and the `BACKGROUND_BLUR` radius-70 finding)
- **Spec:** `docs/design-system/library-r1-page-feedback-spec.md`
- **Sanity:** project `l9mhqdtj`, dataset `production`
