> **Where things live** - Client: Lad | Bucket: `clients/Lad/` | Dropbox: `_Clients/Lad/Superbloom/` | Registry: Notion "Repos" DB (IDs in `~/Code/toolhub/CoS/NOTION.md`)

# Superbloom House — Agent Instructions

Website for SuperBloom House (superbloomhouse.com) via Lad Company.


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
