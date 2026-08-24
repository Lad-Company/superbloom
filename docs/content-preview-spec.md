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
  content. ~~This is the path preview mode reuses.~~ (Superseded, see §4:
  preview no longer reuses the reduced-motion path.)
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
6. ~~**Motion quieted in preview** via the existing reduced-motion path: no
   Lenis, no pinned stories, no reveals; content renders in final state.~~
   **Superseded (2026-08-20).** Quieting motion invisibly broke the site for
   anyone holding the cookie: a session cookie survives browser restarts
   under Chrome's "Continue where you left off", so editors who had opened a
   share link or the Presentation tool saw the production site with no Lenis
   and no pinned sections — reported as "the scroll-jack section doesn't
   capture scroll", un-reproducible on any machine without the cookie.
   Preview now runs full motion like any visitor; the visitor's own
   `prefers-reduced-motion` setting is the only motion gate. The cookie also
   gained an 8-hour `Max-Age` backstop and a visible preview bar with an
   Exit affordance (`PreviewBar.astro`) so draft mode can never strand
   anyone silently again.
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

## 4. Workstream 2 — Web: preview visibility (supersedes "quiet motion")

**Original plan (2026-08-11), now reverted:** quiet motion in preview by
reusing the reduced-motion path (`prefersReducedMotion()` honoring
`data-preview`, early-returns in `pinnedStory.ts` / `depthLayer.ts` /
`horizontalRail.ts`, an `html[data-preview]` final-state block in
`styles/motion.css`). Reverted 2026-08-20 — see decision 6: with no visible
indicator, the quieted motion read as a broken site to cookie-holding
editors, and the whole failure class was invisible to anyone without the
cookie.

Current behavior:

- Preview runs the **full motion system**, identical to any visitor; the
  visitor's own `prefers-reduced-motion` setting is the only gate.
- `data-preview` on `<html>` still marks the request for GA suppression and
  draft-content switching, but motion code no longer reads it.
- `PreviewBar.astro` (rendered by Layout on preview requests) makes draft
  mode visible and offers an Exit link to `/api/preview/disable`; it hides
  itself inside the Studio Presentation iframe, where the session belongs
  to the tool.
- The enable route sets the cookie with an 8-hour `Max-Age` — a session
  cookie survives browser restarts under Chrome's session restore.

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
- [x] ~~Unit: `prefersReducedMotion()` honors `data-preview`.~~ Superseded:
      unit asserts preview does **not** force reduced motion (see §4).
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check` green.

Manual:

- [ ] Presentation pane renders a draft homepage edit live, unpublished.
- [ ] A share link opened in a clean browser shows drafts; the same URLs in a
      browser without the cookie show published content only.
- [ ] Preview responses carry `Cache-Control: no-store`; normal responses keep
      the public edge cache header.
- [ ] ~~Native scroll (no Lenis) and final-state content inside the preview;
      motion unchanged for normal visitors.~~ Superseded (see §4): preview
      runs full motion; the preview bar is visible outside the Studio iframe
      and Exit clears the cookie.
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
  `sanity dev` and `https://superbloom-theta.vercel.app` when deployed).
- **Multi-environment preview.** The pane previews dev, staging, or prod:
  `SANITY_STUDIO_PREVIEW_ORIGINS` (comma-separated allow list, default
  `http://localhost:*,https://superbloom-theta.vercel.app,https://superbloomhouse.com`)
  and `SANITY_STUDIO_PREVIEW_ORIGIN` (initial origin) are read at Studio
  build time; editors switch origins at runtime via the Studio URL's
  `?preview=` param. Pre-launch wrinkle: `superbloomhouse.com` still serves
  the legacy Netlify site, so the deployed Studio defaults to the Vercel
  staging URL until the DNS flip. `SANITY_API_READ_TOKEN` covers every
  environment: `.env.local` for dev, and the single Vercel project's
  Production scope serves both theta today and the prod hostname after
  launch.
- **The Presentation connection requires `@sanity/visual-editing` in the
  preview response** (added 2026-08-12 after the deployed pane failed with
  "Unable to connect" and an empty "Documents on this page"). The §2.4 "No
  Visual Editing" decision was implemented as omitting the package entirely,
  but in sanity v4 the tool establishes its iframe channel — URL reporting,
  location resolution, and mutation refreshes — over the comlink endpoint
  that package provides, regardless of overlays. `Layout.astro` now loads
  `lib/visualEditing.ts` only when the preview cookie is present: it wires a
  ClientRouter `history` adapter and a `refresh` handler that reloads the
  page (SSR has no client loaders to patch in place). The §2.4 decision
  stands functionally: content is not stega-encoded, so the overlay scan
  finds no targets and no click-to-edit UI appears. Cost: the overlay
  runtime (~1 MB unminified in dev, lazy-loaded) ships with preview
  responses only — regular visitors never download it.

---

## 11. Staging breakage amendments (2026-08-21, ADR-0031)

Three staging reports — no preview bar on opened links, "Unable to connect"
in the pane on first visit, and a permanently empty "Documents on this
page" — traced to two root causes plus one dead switch. All were diagnosed
with a curl-only loop (mint a `sanity.previewUrlSecret` draft with the write
token → hit `/api/preview/enable` → re-fetch with the cookie and assert on
markup + `Cache-Control` + `x-vercel-cache`).

- **The edge cache hijacked preview requests (both link and pane).** §3.4's
  `no-store` on preview responses protected the public from drafts, but not
  editors from the public cache: Vercel keys its edge cache by URL, not
  cookie, so any URL with a live public copy (60s fresh + **24h
  stale-while-revalidate**) served the published page to cookie-carrying
  requests. That page carries no `@sanity/visual-editing` script (the comlink
  handshake times out — "Unable to connect"), no `PreviewBar`, no
  `data-preview`, and GA on. One cookie-less visit to a URL poisoned preview
  on it for up to a day, which is why the failures read as intermittent /
  "first visit". Fix: content HTML is never shared-cached — `setContentCache`
  sends `private, no-cache` for published responses (preview stays
  `no-store`); `setPublicCache` remains for cookie-independent endpoints
  (sitemap). Measured trade in ADR-0031; the path back to edge-cached HTML
  is ISR + `bypassToken`, never TTL tuning.
- **"No matching documents" was a missing `resolve.mainDocuments`.** The
  pane's only feeds are overlay-reported stega refs (deliberately absent,
  §2.4) and the URL→document `mainDocuments` map, which was never
  configured. `presentation.ts` now maps every routable surface (`/`,
  `/index`, `/work(/:slug)`, `/who-we-are`, `/articles/:slug`, `/zine`,
  `/zine/issues/:slug(/read)`, `/zine/issues/:issueSlug/:articleSlug`);
  Shopify surfaces have no Sanity document and stay unmapped.
- **Share access was off.** The `sanity-preview-url-secret.share-access`
  singleton existed with a null secret, so every outstanding share link got
  a 401. Re-enabled via the API (equivalent to the tool's Share toggle);
  rotation remains "toggle Share access off/on in the tool" per §10.
