# Hotspot / Focal-Point Deployment — Handoff

Mission paused mid-investigation. Schema + studio deploy are live; the editor hotspot UI on the deployed staging studio is showing issues that need follow-up.

## Current state

- **Branch:** `main`, HEAD `05faa97` (`feat: focal-point-aware Sanity CDN cropping for MediaFrame`)
- **Schema package:** `packages/schemas/src/mediaBox.ts` enables `hotspot` on the image member with three preview aspects (9:16, 1:1, 2:1) and a pin-guiding description.
- **Studio deploy:** `pnpm --filter studio build && sanity deploy --yes` ran successfully against project `l9mhqdtj` / dataset `production` / `superbloom-cms` host. Output: `✓ Deployed 1/1 schemas`, Studio live at https://superbloom-cms.sanity.studio/.
- **Site rendering:** `apps/web/src/components/MediaFrame.astro` consumes the new GROQ projection (asset / crop / hotspot / width / height / mimeType) and emits `<img src srcset sizes>`. SVG and video untouched; untouched images fall back to center-crop.
- **OG images:** `apps/web/src/lib/seo.ts` builds 1200×630 URLs through `urlFor` so the editor's pin survives social-card cropping.
- **Gate is green on `main`:** `pnpm typecheck` (web + schemas + studio), `pnpm lint`, 70 web tests + 190 schemas tests passing.

## Reported issue (the next session's job)

**Reported:** Seeing hotspot editing issues in the deployed staging site right now.

Open the Studio (https://superbloom-cms.sanity.studio/), open any document that uses `mediaBox` (case studies, articles, the homepage, the who-we-are singleton, zine issues), and try to add or edit the image inside a `mediaBox.asset[0]`. Report back what the editor sees.

Likely suspects to grep for once you reproduce:

1. **Hotspot not appearing at all on the mediaBox image picker.** `mediaBox.ts` declares hotspot on the asset member's image `of: [mux.video, image{ hotspot: { previews: [...] } }]`. Verify that nested `options.hotspot` actually applies when the image is inside an array of `of:`. Sanity typically expects the `hotspot` option to live on the schema *type* declaration itself, not on a member of an `array.of` entry. If that's the case, the fix is to define the image as a custom type:
   ```ts
   defineType({ name: 'mediaBoxImage', type: 'image', options: { hotspot: { previews: [...] } } })
   ```
   and reference `{type: 'mediaBoxImage'}` inside `of:`.

2. **Hotspot shows but previews are wrong / missing.** Three preview thumbs should appear: Portrait 9:16, Square 1:1, Wide 2:1. If fewer show, confirm the build picked up the new `packages/schemas/src/mediaBox.ts` (sanity caches the dependency graph — check `apps/studio/dist/static/` for the bundled schema or run `sanity schema list --enforce-required-fields`).

3. **Pin is saved but doesn't render on the site.** The hotspot pin is stored on `asset.hotspot`. The new GROQ projects it (see `apps/web/src/lib/queries.ts` `mediaProjection`), and `MediaFrame.astro` passes it to `urlFor` as `source.hotspot`. Verify on a fixture document: edit the pin, save, then check the page HTML has `fp-x`/`fp-y` query params on the request URLs.

4. **Crop tool misbehaves.** Sanity bundles a crop box with `hotspot: true`. Editors can use it or ignore it. The spec calls this out and the field description encourages the pin-only workflow. If editors are confused by both controls, refine the description string in `mediaBox.ts`.

## Files most likely to need editing next

- `packages/schemas/src/mediaBox.ts` — re-declare the image as its own type if the nested-options hypothesis (1) holds
- `apps/studio/sanity.config.ts` — sanity.plugins; unlikely
- `apps/web/src/components/MediaFrame.astro` — only if the rendering pin is the issue (3)

## Repro & debug steps

```
# 1. Sign into the staged studio (URL above) using existing credentials
# 2. Open any mediaBox-containing doc (e.g. Who We Are singleton, hero image)
# 3. Click into the asset image — try to add the pin
# 4. Save; then optionally run a Vercel preview of the home page and inspect <img>
```

If you need to roll back the production schema while fixing:

```
cd /Users/pete/Code/superbloom/packages/schemas
# Revert the hotspot options.blocks' preview list or move image to a custom type
# Then rebuild + redeploy studio:
cd /Users/pete/Code/superbloom/apps/studio && pnpm build && pnpm exec sanity deploy --yes
# Hot-modules: clear browser cache on /studio/ before re-testing
```

## Key resources

- **Spec:** `docs/design-system/focal-point-hotspot-implementation-spec.md`
- **KB research:** `KB/Sanity focal point + image cropping (research).md` (per spec)
- **Sanity project:** `l9mhqdtj` / `production` / hosted at `superbloom-cms.sanity.studio`
- **Reference commit:** `05faa97` (focal-point impl), `c7b74e9` (last commit before this work)
- **Code review snippets to keep in mind:**
  - The new projection nests the asset ref at `media.asset.asset._ref`. If `urlFor` calls ever return `undefined`, that nesting is the first place to check.
  - Inline `sizes` strings differ per consumer ("100vw" for full-bleed heroes vs "(max-width: 1023px) 100vw, 50vw" for paired). Consolidating into a `MEDIA_FRAME_SIZES` recipe was reviewed and rejected as speculative generality — keep them inline for now.

## Out-of-scope

- Video focal points
- Per-shape dynamic Studio previews
- Manual data migration (untouched images stay center-crop)
- Editor-facing KB documentation
