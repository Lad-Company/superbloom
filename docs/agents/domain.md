# Domain Docs

Skills like `diagnose`, `improve-codebase-architecture`, and `tdd` read domain knowledge from your repo to make better decisions.

## Layout: Single-context

This repo uses a **single-context** layout:
- **`CONTEXT.md`** at the repo root — domain language, project vocabulary, key concepts
- **`docs/adr/`** — architectural decision records (ADRs) explaining past design choices

## CONTEXT.md

Create `CONTEXT.md` at the repo root. Include:

- **Project summary** — what Superbloom is, who uses it, core value
- **Domain vocabulary** — terms agents should understand (e.g., "creator directory", "video delivery", "Shopify sync")
- **Architecture overview** — high-level component map (frontend, backend, services)
- **Key constraints** — performance targets, browser support, animation fidelity, etc.
- **Tech stack decisions** — why Next.js vs Nuxt, why Sanity vs WordPress, etc.
- **Known pain points** — what's hard about this codebase, what trips people up

Example structure:
```markdown
# Superbloom House — Domain Context

## Project
[summary]

## Domain Vocabulary
- **Creator Directory** — ...
- **Video Delivery** — ...
- **Shop Sync** — ...

## Architecture
[diagram or description]

## Constraints
- Animation fidelity must match current site
- Video player custom (not iframe)
- Shopify sync must be real-time

## Tech Stack
- **Frontend:** Next.js (App Router)
- **CMS:** Sanity / WordPress (TBD)
- **Video:** Mux / Bunny.net (TBD)
- **Commerce:** Shopify Storefront API

## Known Pain Points
- Large scope (93 pages)
- Custom animations require scroll-driven JS
```

## docs/adr/

Create architectural decision records in `docs/adr/` as you make major choices:

```
docs/adr/
├── 001-framework-selection.md
├── 002-cms-choice.md
├── 003-video-delivery.md
└── README.md
```

Each ADR includes:
- **Context** — what problem were we solving?
- **Decision** — what did we choose?
- **Consequences** — what changed as a result?

Example:
```markdown
# ADR 001: Framework Selection

## Context
Website redesign from Nuxt.js/Vue to modern stack. Need to balance animation fidelity, developer velocity, and team familiarity.

## Decision
Use Next.js 14+ with App Router (Option A).

## Consequences
- Familiar to Pete, strong ecosystem for animations
- Can leverage Vercel for hosting
- WordPress migration path is clear
```

Skills will read these files to understand past decisions and avoid rehashing them.
