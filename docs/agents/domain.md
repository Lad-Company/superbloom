# Domain Docs

How engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — domain glossary and canonical terminology.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If any of these files don't exist, proceed silently.

## File structure

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-astro-over-nextjs.md
│       ├── 0002-sanity-cms.md
│       ├── 0003-no-database.md
│       ├── 0004-mux-for-video.md
│       ├── 0005-monorepo-web-studio-schemas.md
│       └── 0006-mailchimp-only-no-resend.md
└── apps/
    ├── web/        — Astro app
    └── studio/     — Sanity Studio
```

## Use the glossary's vocabulary

When naming domain concepts (in issue titles, refactor proposals, test names), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids — e.g., say "Creator" not "freelancer", "Case Study" not "project", "Team Member" not "employee".

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0003 (no database) — but worth reopening because…_
