> **Where things live** - Client: Lad | Bucket: `clients/Lad/` | Dropbox: `_Clients/Lad/Superbloom/` | Registry: Notion "Repos" DB (IDs in `~/Code/toolhub/CoS/NOTION.md`)

# Superbloom House — Agent Instructions

Website for SuperBloom House (superbloomhouse.com) via Lad Company.

**The site is in production.** Most work here is maintenance and bug fixes, not
new features. Bias toward small, reversible changes; preserve editor content and
the settled decisions in `ARCHITECTURE.md`.

## Working on this repo

- **Read before touching code:** `CONTEXT.md` (domain glossary),
  `ARCHITECTURE.md` (architecture + collapsed decision log), and
  `docs/design-system.md` (design/UI/motion intent). Code is the source of
  truth for field-level detail; flag any conflict with a logged decision
  instead of silently overriding it.
- **Verify every change** from the repo root: `pnpm lint`, `pnpm typecheck`,
  `pnpm test`. Run `pnpm typegen` after any schema change in
  `packages/schemas`.
- **Deploys:** merging to `main` deploys the site to production on Vercel.
  The Studio deploys separately (`sanity deploy` from `apps/studio`).
- **Observability:** errors aggregate in Sentry project `sbh-web` and alert to
  Discord `#site-alerts`; deploys and content publishes post to
  `#site-activity`. Pipeline details: `docs/observability-pipeline-spec.md`.
- **Open investigations:** the shy-nav dismiss "snap" bug is paused; read
  `docs/shy-nav-dismiss-snap-log.md` before retrying it (note its code-drift
  warning — the code it describes has moved on).

## Agent skills

### Issue tracker

Issues live in GitHub Issues (github.com/Lad-Company/superbloom). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical states: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout at the repo root: `CONTEXT.md` (domain glossary),
`ARCHITECTURE.md` (architecture + collapsed decision log), and `docs/design-system.md`
(design/UI/motion intent). See `docs/agents/domain.md`.

### Worktrees

Parallel agents work in separate git worktrees, each needing its own `pnpm install`
and `.env.local`. Killed dev servers can poison the Vite dep cache, silently breaking
video and motion. See `docs/agents/worktrees.md`.
