# Content Preview — Sanity Presentation + Cookie-Gated Draft Mode

Let content editors preview unpublished drafts rendered by the real site, both
inside Sanity Studio (Presentation tool) and via shareable links, without any
staging environment.

Decisions confirmed by interview on 2026-08-11. Code is source of truth for
implementation detail; this file records intent and the locked decisions.

---

## 0. Goal

An editor writing in the Studio can see their **draft** (unpublished) document
rendered by `apps/web` before hitting Publish:

- in a **Presentation pane** inside the Studio, updating live as they type;
- via a **shareable preview link** they can send to someone without a Sanity
  login (Lauren, a client) for review.

Publishing behavior is unchanged: published edits already go live within
~1 minute (SSR + 60s edge cache) and need no deploy.

## 1. Current state (facts)

- `apps/web` is Astro SSR (`output: 'server'`, `@astrojs/vercel`), fetching from
  Sanity **per request** (ADR-0008). No rebuild is ever needed for content.
- `apps/web/src/lib/sanity.ts` is a bare client: `useCdn: true`, no token, no
  `perspective`. **Drafts are invisible to the site today.**
- `apiVersion: '2026-06-01'` — supports `perspective: 'drafts'`.
- No Presentation tool in `apps/studio/sanity.config.ts`; no preview/draft
  routes in `apps/web/src/pages/api/`.
- No `X-Frame-Options`/CSP/`frame-ancestors` anywhere in `apps/web`, so the
  site can be iframed by the Studio without header changes.
- Content pages set `Cache-Control: public, s-maxage=60,
stale-while-revalidate=86400` via `lib/cacheHeaders.ts` (`setPublicCache`).
  **Draft responses must never carry this**, or Vercel's edge cache (keyed by
  URL, not cookie) could serve draft content to the public.
- The existing `SANITY_API_TOKEN` is write-capable (used by
  `pages/api/contact.ts` to create `formSubmission` docs, and by Studio
  migration scripts). Preview needs a **separate viewer token**.
- Motion: `initSmoothScroll()` (Lenis) already bails on
  `prefersReducedMotion()`; `reveal.ts` checks it at init; three modules gate
  on `mm.add('(prefers-reduced-motion: no-preference)')` directly
  (`pinnedStory.ts`, `depthLayer.ts`, `horizontalRail.ts`);
  `styles/motion.css` has a reduced-motion block that renders final-state
  content. This is the path preview mode reuses.
- `layouts/Layout.astro` computes a `gaMode` by hostname; preview traffic must
  not count as prod GA.
- The Studio is dashboard-hosted (ADR-0023) with CORS already configured. All
  preview fetches happen **server-side** in Astro, so no new CORS entries.
- `astro:transitions` ClientRouter is in use; preview must survive View
  Transition navigations.

## 2. Confirmed decisions (2026-08-11)

1. **Draft preview only.** No pre-publication staging gate, no second dataset,
   no content promotion workflow, no Content Releases.
2. **Two surfaces:** Presentation tool inside Studio **and** shareable secret
   preview links. Both run through the same enable/disable routes.
3. **Production URL, cookie-gated.** No staging hostname or second Vercel
   deployment. Drafts are visible only to requests carrying the preview cookie.
4. **No Visual Editing / stega overlays.** Plain preview only; revisit only if
   editors ask for click-to-edit.
5. **Full resolve map** (see §5): every routable document type gets a preview
   location; News → `/index`; Site Settings → `/`; Capability, Tag, and Form
   Submission get none.
6. **Motion quieted in preview** via the existing reduced-motion path: no
   Lenis, no pinned stories, no reveals; content renders in final state.
7. **No editor-facing docs** in scope.
8. **This spec lives in `docs/`** with a GitHub tracking issue.

## 3. Workstream 1 — Web: draft-mode infrastructure (`apps/web`)

### 3.1 Env and secret

- New shared secret `SANITY_PREVIEW_SECRET` (generate with
  `openssl rand -hex 32`). Used by the Studio Presentation config to sign
  preview URLs and by the web enable route to verify them.
- New viewer-scoped token `SANITY_API_READ_TOKEN` (manage.sanity.io → project
  `l9mhqdtj` → API → Tokens → Viewer). Do **not** reuse the write-capable
  `SANITY_API_TOKEN` for preview reads.
- Both go in the root `.env.local` (web reads env from repo root per
  `envDir: '../..'`) and in Vercel env for Production. The secret also goes in
  the Studio's env for the Presentation config.

### 3.2 Enable / disable routes

New endpoints under `apps/web/src/pages/api/preview/`:

- `GET /api/preview/enable` — validates the incoming signed URL with
  `@sanity/preview-url-secret` (`validatePreviewUrl` with a client using
  `SANITY_API_READ_TOKEN` + `SANITY_PREVIEW_SECRET`). On success: set the
  preview cookie and redirect to the validated target path. On failure:
  `401`, no cookie, no redirect.
- `GET /api/preview/disable` — clears the cookie, redirects to the referer
  path or `/`. This is also how share-link recipients exit draft mode.

Cookie: name `sb_preview`, `HttpOnly`, `Secure`, `SameSite=None`, `Path=/`,
**session lifetime** (no `Max-Age`). `SameSite=None` is required or the
browser withholds the cookie inside the Studio's cross-origin iframe; session
lifetime means share links self-expire when the browser closes.

Note: `@sanity/preview-url-secret` and the Presentation tool's option names
have shifted across releases (`previewMode` → `draftMode`); verify the current
API shape against the installed `sanity` version at implementation time.

### 3.3 Preview-aware Sanity client

`lib/sanity.ts` gains `getSanityClient(preview: boolean)`:

- `preview: false` — today's client, byte-for-byte (`useCdn: true`, no token).
- `preview: true` — `perspective: 'drafts'`, `useCdn: false`,
  `token: SANITY_API_READ_TOKEN`.

Plus a small request helper, e.g. `isPreviewRequest(cookies)`, reading the
`sb_preview` cookie. Pages get one line of boilerplate:

```ts
const preview = isPreviewRequest(Astro.cookies)
const client = getSanityClient(preview)
```

### 3.4 Page integration + cache safety

Every SSR content route switches to the context client and picks its cache
header by preview state:

- preview → `Cache-Control: no-store` (never `setPublicCache`);
- otherwise → unchanged behavior.

Routes to touch: `/` (homepage), `/index`, `/work`, `/work/[slug]`,
`/who-we-are`, `/zine`, `/zine/issues/[issueSlug]`,
`/zine/issues/[issueSlug]/[articleSlug]`, `/articles/[slug]`. Component-level
fetches must use the same helper: **Footer** (`siteSettings`) and any other
component that fetches directly. Prerendered/utility surfaces (sitemap,
robots, 404) are excluded — they can't vary by cookie and don't need to.

### 3.5 Layout: preview flag + GA suppression

When `isPreviewRequest` is true, `layouts/Layout.astro`:

- renders `<html lang="en" data-preview>` (the flag motion reads, §4);
- forces `gaMode` to `'off'` so editor/share-link preview traffic never hits
  prod analytics.

The flag must survive View Transitions: stamp it on the incoming document in
the same `astro:before-swap` path that stamps the `js` class.

## 4. Workstream 2 — Web: quiet motion in preview

Reuse the reduced-motion path; do not build a parallel system.

- `lib/motion/config.ts`: `prefersReducedMotion()` also returns `true` when
  `document.documentElement.hasAttribute('data-preview')`. Lenis
  (`smoothScroll.ts`) and reveals (`reveal.ts`) pick this up for free.
- The three direct `mm.add('(prefers-reduced-motion: no-preference)')` sites
  (`pinnedStory.ts`, `depthLayer.ts`, `horizontalRail.ts`) early-return when
  the preview flag is set.
- `styles/motion.css`: mirror the existing reduced-motion final-state block
  under an `html[data-preview]` selector so reveal targets never start hidden.

Editors judge content and layout in the preview; motion QA stays on the real
site.

## 5. Workstream 3 — Studio: Presentation tool (`apps/studio`)

Add `presentationTool` (from `sanity/presentation`) to `sanity.config.ts`:

- `previewUrl.origin` from env (`SANITY_STUDIO_PREVIEW_ORIGIN`; production
  default `https://superbloomhouse.com`, `http://localhost:4321` for local
  dev), with the enable/disable route paths from §3.2 and the shared
  `SANITY_PREVIEW_SECRET`.
- `resolve.locations` map:

| Document                              | Preview location                                  |
| ------------------------------------- | ------------------------------------------------- |
| `homepage`                            | `/`                                               |
| `workIndex`                           | `/work`                                           |
| `whoWeAre`                            | `/who-we-are`                                     |
| `zineLanding`                         | `/zine`                                           |
| `indexPage`                           | `/index`                                          |
| `siteSettings`                        | `/`                                               |
| `caseStudy`                           | `/work/[slug]`                                    |
| `article` (Editorial)                 | `/articles/[slug]`                                |
| `article` (News)                      | `/index` (card-only, no detail page per ADR-0022) |
| `article` (Zine)                      | `/zine/issues/[issue]/[article]`                  |
| `zineIssue`                           | `/zine/issues/[slug]`                             |
| `capability`, `tag`, `formSubmission` | none (structural, not designed surfaces)          |

## 6. Ops — deploy order and rotation

1. Create the Viewer token; generate the secret; set env vars locally and in
   Vercel (Production).
2. Deploy **web first** — the enable/disable routes must exist before the
   Studio points at them.
3. Deploy the Studio (`sanity deploy`).
4. End-to-end verify per §7.

**Secret rotation:** rotate `SANITY_PREVIEW_SECRET`, update Vercel + Studio
env, redeploy both. All outstanding share links die immediately; active
preview sessions end at browser close (session cookie). Rotation is the
response if a share link leaks.

## 7. Validation checklist (implementation task)

Automated:

- [ ] Unit: `getSanityClient` returns CDN/published config by default and
      drafts/no-CDN/token config in preview.
- [ ] Unit: cache-header selection — preview requests get `no-store`,
      non-preview keep `setPublicCache` output.
- [ ] Unit: enable route rejects a bad signature with 401 and sets no cookie;
      accepts a valid one, sets cookie, redirects to the target path.
- [ ] Unit: `prefersReducedMotion()` honors `data-preview`.
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check` green.

Manual:

- [ ] Presentation pane renders a draft homepage edit live, unpublished.
- [ ] A share link opened in a clean browser shows drafts; the same URLs in a
      browser without the cookie show published content only.
- [ ] Preview responses carry `Cache-Control: no-store`; normal responses keep
      the public edge cache header.
- [ ] Native scroll (no Lenis) and final-state content inside the preview;
      motion unchanged for normal visitors.
- [ ] GA scripts absent in preview responses.
- [ ] Disable route exits draft mode.
- [ ] View Transition navigation between pages keeps the preview active.

## 8. Non-goals

- Staging dataset, staging hostname, or any deploy-on-content-change pipeline.
- Content promotion workflows; Sanity Content Releases / scheduled publishing.
- Visual Editing overlays and stega encoding.
- Editor-facing documentation.
- Shopify, Mailchimp, and form-submission previews (not content surfaces).

## 9. Follow-ups (when implemented)

- Add a collapsed ADR to `ARCHITECTURE.md` (next number): preview via
  Presentation + cookie-gated draft mode on the production URL; rejected
  staging dataset/hostname and Visual Editing overlays.
- If editors ask for click-to-edit, spec Visual Editing separately — it needs
  a stega audit across `lib/` string derivations (slugs, URLs, JSON-LD,
  surface-role math) before it is safe on this codebase.
- If session-cookie expiry annoys share-link recipients, consider a short
  `Max-Age` instead; keep it measured in hours, not days.

---

## 10. Implementation amendments (2026-08-11)

Recorded at implementation time against the installed `sanity@4.22` +
`@sanity/preview-url-secret@3.0.0`, per the verify-the-API-shape note in §3.2:

- **No `SANITY_PREVIEW_SECRET` env var.** The installed Presentation tool has
  no shared-secret option: it mints secrets via `createPreviewSecret` and
  stores them as `sanity.previewUrlSecret` documents in the dataset;
  `validatePreviewUrl` checks incoming URLs against those using the viewer
  token. Only `SANITY_API_READ_TOKEN` was added to env (root `.env.local` +
  Vercel Production).
- **Secret rotation** (§6) is therefore: toggle **Share access** off/on in
  the Presentation tool, which mints a fresh secret and kills outstanding
  share links. No redeploy, no env change.
- **`previewMode.disable` is not implemented** by the installed tool (the API
  marks it deprecated), so the Studio never calls it; the disable route still
  serves share-link recipients and manual exit, exactly as §3.2 specifies.
- **`previewUrl.origin` is deprecated** in this release; the Studio config
  uses `previewUrl.initial` with the same env-driven value
  (`SANITY_STUDIO_PREVIEW_ORIGIN`, defaulting to `http://localhost:4321` under
  `sanity dev` and `https://superbloomhouse.com` otherwise).
