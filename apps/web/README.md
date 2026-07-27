# web

The public Superbloom House website. Built with [Astro](https://astro.build) in SSR mode
(`output: 'server'`) using the Vercel adapter, [UnoCSS](https://unocss.dev) for styling, and
GSAP/Lenis for motion. Content is sourced from the Sanity Studio in `apps/studio` via
`@sanity/client` and shared schemas from `@superbloom/schemas`.

## Development

Run from the repo root (preferred, so workspace deps resolve):

```sh
pnpm web        # dev server at http://localhost:4321
```

Or from this directory:

| Command           | Action                                          |
| ----------------- | ----------------------------------------------- |
| `pnpm dev`        | Start the local dev server                      |
| `pnpm build`      | Build the production (server) output            |
| `pnpm preview`    | Preview the production build locally            |
| `pnpm typecheck`  | Type-check with `astro check`                   |
| `pnpm test`       | Run the Vitest suite                            |

## Structure

```
src/
  pages/        route files (.astro)
  components/   UI components, grouped by area
  layouts/      shared page layouts
  lib/          data-shaping helpers (with unit tests)
```

Environment variables are read from the repo root (`envDir: '../..'`).
