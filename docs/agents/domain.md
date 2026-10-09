# Domain Docs

How engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — domain glossary and canonical terminology.
- **`ARCHITECTURE.md`** at the repo root — architecture-of-record and the collapsed
  decision log (formerly `docs/adr/`); read the decisions touching your area.
- **`docs/design-system.md`** — design, UI, theming, and motion intent.

If any of these files don't exist, proceed silently.

## File structure

```
/
├── CONTEXT.md          — domain glossary
├── ARCHITECTURE.md     — architecture + decision log
├── docs/
│   ├── design-system.md
│   ├── *-spec.md       — specs for work in flight; landed specs are folded
│   │                     into ARCHITECTURE.md ADRs and deleted (exception:
│   │                     observability-pipeline-spec.md stays as the
│   │                     pipeline's reference doc)
│   └── agents/
├── packages/
│   └── schemas/        — shared Sanity schemas + contract/migration tests
└── apps/
    ├── web/            — Astro app
    └── studio/         — Sanity Studio
```

## Use the glossary's vocabulary

When naming domain concepts (in issue titles, refactor proposals, test names), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids — e.g., say "Case Study" not "project", "Work" not "portfolio", "Zine" not "blog", "Media Asset" not "file".

## Flag decision conflicts

If your output contradicts a decision in `ARCHITECTURE.md` (the collapsed ADR log),
surface it explicitly rather than silently overriding:

> _Contradicts ADR-0003 (no database) — but worth reopening because…_
