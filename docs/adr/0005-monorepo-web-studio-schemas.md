# Monorepo: web + studio + schemas

The repo uses a pnpm workspaces monorepo with three packages:

```
apps/web/       — Astro app, deployed to Vercel
apps/studio/    — Sanity Studio, deployed via `sanity deploy` to superbloom.sanity.studio
packages/schemas/  — shared TypeScript schema definitions
```

Sanity Studio is a separate deployment from the Astro app — not bundled into it. `packages/schemas/` is the single source of truth for content types: the Studio imports it to render editing UI, the Astro app imports it for TypeScript autocomplete on query results.

**Why not bundle Studio into the Astro app**: Separate deployments keep Studio concerns isolated and allow independent deploy cadences. Studio can be hosted for free via `sanity deploy`; bundling it adds build complexity for no benefit.
