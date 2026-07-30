# Worktrees & dev servers

Parallel agents each work in their own git worktree with their own dev server.
This file records the recurring failure modes of that setup and their fixes.

## The frequent one: poisoned Vite dep cache

**Symptom:** pages render fine (200s, markup intact) but **video does not play**
and **text/scroll animations do not run**. No errors in the server log.

**Cause:** a dev server was killed (or crashed) while Vite was writing its
pre-bundled dependency cache (`apps/web/node_modules/.vite`). Later servers reuse
the half-written cache and return **504 Outdated Optimize Dep** for pre-bundled
deps. In this repo that kills `@mux/mux-player` (all video) and `gsap` (all
motion), while plain TS modules still transform fine.

**Diagnose** (pull a dep URL out of any served component script, then probe it):

```sh
curl -s "http://localhost:<port>/src/components/MediaFrame.astro?astro&type=script&index=0&lang.ts" \
  | grep -oE '/node_modules/.vite/deps/[^"]+'
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:<port><dep-url>"
# 504 = poisoned cache (200 = healthy)
```

**Fix:**

```sh
# stop the dev server, then:
rm -rf apps/web/node_modules/.vite
pnpm dev   # deps re-optimize fresh on first request
```

**Prevention:** don't kill a dev server during its first page load (that is when
deps optimize). If you must, clear `.vite` before the next start.

## Worktree checklist for agents

1. `git worktree add <path> -b <branch>`
2. `cp .env.local <path>/.env.local` — env is read from the repo root via
   `envDir: '../..'` in `apps/web/astro.config.mjs`; the file is gitignored so
   worktrees don't get it automatically.
3. `pnpm install` in the worktree — `node_modules` is not shared.
4. `pnpm dev` auto-increments when a port is taken (4321, 4322, ...). Read the
   actual URL from the server log and report that one, not the requested port.
5. Before handing a server to a human, probe one `@mux/mux-player` and one
   `gsap` dep URL (above) and confirm 200 — this is the fast check that video
   and motion will actually work in the browser.
