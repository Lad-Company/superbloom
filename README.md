# Superbloom House

Website redesign and rebuild for [Superbloom House](https://superbloomhouse.com), a production company that blends an internal creative team with a curated external Creative Collective.

This is a pnpm monorepo containing the public website, the Sanity CMS that powers it, and the shared content schemas used by both.

## Workspace layout

| Package             | Path                | Description                                                        |
| ------------------- | ------------------- | ----------------------------------------------------------------- |
| `web`               | `apps/web`          | Public site. Astro (SSR via the Vercel adapter) + UnoCSS + GSAP.  |
| `studio`            | `apps/studio`       | Sanity Studio CMS (project `l9mhqdtj`, dataset `production`).     |
| `@superbloom/schemas` | `packages/schemas` | Shared Sanity content schemas and migration/contract test suite. |

## Requirements

- Node.js `>=22.12` (CI and Vercel build on Node 24)
- pnpm `10.15.1` (pinned via the `packageManager` field)

## Setup

```sh
pnpm install
```

Environment variables are read from the repo root (`apps/web` uses `envDir: '../..'`).

## Commands

Run from the repo root:

| Command             | Action                                                            |
| ------------------- | ----------------------------------------------------------------- |
| `pnpm web`          | Start the Astro dev server (`apps/web`)                           |
| `pnpm studio`       | Start the Sanity Studio dev server (`apps/studio`)                |
| `pnpm typegen`      | Regenerate Sanity types from the schema                           |
| `pnpm lint`         | Lint all packages with ESLint                                     |
| `pnpm lint:fix`     | Lint and auto-fix                                                 |
| `pnpm format`       | Format the repo with Prettier                                     |
| `pnpm format:check` | Check formatting without writing                                  |
| `pnpm typecheck`    | Type-check every package (`astro check` for web, `tsc` elsewhere) |
| `pnpm test`         | Run the test suites (Vitest)                                      |
| `pnpm build`        | Build every package (`astro build`, `sanity build`)              |

## Further reading

- `AGENTS.md` - agent instructions, stakeholders, and workflow conventions
- `CONTEXT.md` - domain model and ubiquitous language
- `docs/` - ADRs, agent docs, and design-system notes
