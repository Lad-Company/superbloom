# Architecture

How the Superbloom House system is built, and the decisions behind it. Agents-first.

- **Domain language:** `CONTEXT.md` (ubiquitous language / glossary).
- **Design + content-model intent:** `docs/design-system.md`.
- **Agent workflow:** `AGENTS.md` and `docs/agents/`.
- **Known code drift:** `docs/code-drift.md` (deadweight and mismatches to fix in code).

This file is the architecture-of-record and the collapsed decision log. Code
(`apps/web`, `apps/studio`, `packages/schemas`) is the source of truth for
implementation detail.

---

## 1. Shape

A pnpm workspaces monorepo:

| Package | Path | What it is |
| --- | --- | --- |
| `web` | `apps/web` | Public site. Astro (SSR via Vercel adapter) + UnoCSS + GSAP/Lenis. |
| `studio` | `apps/studio` | Sanity Studio CMS (project `l9mhqdtj`, dataset `production`). Deploys independently. |
| `@superbloom/schemas` | `packages/schemas` | Shared Sanity schemas + contract/migration test suite. |

`packages/schemas` is the single typed source of content shape; `apps/web` runs
`typegen` from it (`apps/web/src/sanity.types.ts`).

## 2. Rendering and hosting

- `astro.config.mjs`: `output: 'server'`, `@astrojs/vercel` adapter, UnoCSS and
  `@sentry/astro` integrations, `site: https://superbloomhouse.com`,
  `vite.envDir: '../..'` (env read from repo root).
- Production hosting: Vercel team `superbloom` (Superbloom-owned **Pro**,
  transferred 2026-09-29), project `superbloom`, root directory `apps/web`.
  Cutover from the legacy Netlify site is a nameserver change at the Domain.com
  registrar to Vercel DNS — runbook: `docs/dns-cutover-runbook.md` (ADR-0037).
- Content routes are **SSR per-request** from Sanity so editor changes are live;
  static/utility surfaces opt into `prerender = true` (ADR-0008). Content HTML is
  never shared-cached (ADR-0031).
- Styling is UnoCSS over CSS custom properties in `apps/web/src/styles/tokens.css`
  as the token source of truth (ADR-0009). Token specifics: `docs/design-system.md` §1.

## 3. No database — SaaS-owned persistence (ADR-0003)

Every persistent concern is owned by a managed service; the backend is thin Astro
API glue (`apps/web/src/pages/api/*`).

| Concern | Service | Integration |
| --- | --- | --- |
| Editorial content + images | Sanity | `lib/sanity.ts`, `lib/queries.ts` (GROQ) |
| Video | Mux | `mux.video` in `mediaBox`, `<mux-video>` in `MediaFrame` |
| Commerce (products, cart, checkout) | Shopify Storefront API | `lib/shopify*.ts`, `pages/api/shop/*` |
| Email (newsletter) | Mailchimp | `pages/api/newsletter/*` |
| Form records (contact inquiries) | Sanity | `formSubmission` document via `pages/api/contact.ts` |
| Email (transactional notifications) | Resend | `pages/api/contact.ts` |
| Hosting / SSR | Vercel | `@astrojs/vercel` |

## 4. `apps/web` layers

- **`pages/`** — routes (see §5) and API endpoints: `api/contact.ts`,
  `api/newsletter/*`, `api/shop/*`, `api/preview/*` (draft-mode toggle, ADR-0026),
  `api/hooks/*` + `api/debug/*` (observability relay, ADR-0028).
- **`components/`** — primitives, blocks, and per-surface compositions (`home/`,
  `case/`, `who-we-are/`, `editorial/`, `zine/`, `shop/`, `cart/`, `blocks/`,
  `motion/`). Boundaries and primitives: `docs/design-system.md` §2.
- **`lib/`** — data + logic: `queries.ts` (GROQ), `shopify.ts`, `surfaceRole.ts` +
  `luminance.ts` (role → token + WCAG foreground), `contentCard.ts` /
  `contentLayout.ts` (settings resolution), `imageCropping.ts` + `imageLadder.ts`
  (Sanity srcset rungs), `shopifyImages.ts` (Shopify CDN srcset on the same ladder),
  `seo.ts`, `publicationDate.ts`, `mediaRenderingPlan.ts`, `posterReveal.ts`,
  `containsMuxVideo.ts` (page-level `hasVideo` for Mux preconnects), and `motion/`.
- **`lib/motion/`** — `config.ts` (tokens), `smoothScroll.ts` (Lenis), `reveal.ts`,
  `pinnedStory.ts`, `depthLayer.ts`, `horizontalRail.ts`, `hover.ts`, `splitText.ts`,
  `statReveal.ts`, `loading.ts`, `bootstrap.ts` (wired through `index.ts`).
  Motion contract: `docs/design-system.md` §5.
- **`layouts/`**, **`styles/`** (`tokens.css` plus feature-level CSS).

## 5. Routes

- `/` — homepage (Fixed Composition; `homepage` singleton)
- `/index` — mixed Article browse (News + Editorial; Zine lives under `/zine`)
- `/work`, `/work/[slug]` — Case Study browse + detail
- `/who-we-are` — Fixed art-directed page (`whoWeAre` singleton)
- `/articles/[slug]` — News / Editorial Article detail
- `/zine`, `/zine/issues/[slug]`, `/zine/issues/[slug]/read` (Issuu flipbook for
  full issues; embed-only issues redirect back), `/zine/issues/[slug]/[article]`
- `/shop`, `/shop/products/[handle]`, `/cart` (`/shop` optionally leads with a
  CMS-authored Featured Item from the `shopPage` singleton)
- `robots.txt`, `sitemap.xml`, `404`, `500` — error pages share `ErrorPage.astro`;
  content routes guard Sanity reads with `fetchSafe` (from `lib/sanity.ts`) and
  rewrite to `/500` (status 500) on outage
- `/debug/sentry` — secret-gated Sentry smoke-test page (`?secret=$CRON_SECRET`;
  404s without it, `noindex`)

## 6. Content model (schemas)

Authoritative shape lives in `packages/schemas/src`; the intent is in
`docs/design-system.md` §3. In brief:

- **Singletons:** `homepage`, `whoWeAre`, `siteSettings`, `workIndex`, `indexPage`,
  `zineLanding`, `shopPage`.
- **Documents:** `caseStudy`, `article` (unified News/Editorial/Zine via a visible,
  required `articleType` select), `zineIssue`, `capability`, `tag`, `formSubmission`.
- **Shared objects:** `cardSettings`, content composition (`contentLayoutRow` +
  media/text/spacer/carousel items), `mediaBox`, homepage blocks.
- Major content types ship a `*Contract` validator and, where relevant, a
  `*Migration` module, with co-located tests; `homepage`'s contract is a
  source-assertion test rather than a validator module.

---

## 7. Decisions (collapsed ADR log)

One entry per decision; full rationale lives in git history and the referenced
docs. "Superseded" clauses are kept as guardrails (do not re-litigate the
settled part). Where another doc owns the topic, that doc is authoritative.

**Current, in force:**

- **0001 — Astro over Next.js.** Content-heavy site with few interactive islands; Next.js over-provisioned.
- **0002 — Sanity as CMS.** One editor surface (Mux + Shopify Connect), strong migration path. Rejected Directus/Payload/Contentful.
- **0003 — No database.** All persistence via SaaS; no backups/migrations/uptime burden at this scale. Rejected Postgres/Supabase/SQLite.
- **0004 — Mux for video.** First-party Sanity plugin, cheap, AV1 + thumbnails, no YouTube-iframe SEO cost. Rejected Bunny/Cloudflare/Vimeo/YouTube-embed.
- **0005 — Monorepo (web + studio + schemas).** Independent Studio deploys; one typed schema source. Rejected bundling Studio into Astro.
- **0006 — Mailchimp for marketing email, Resend for transactional notifications.** Client already on Mailchimp; avoid a second marketing-email vendor. Narrowed 2026-09 to newsletter only — contact submissions are Sanity `formSubmission` records with no Mailchimp involvement, and the "no auto-subscribe" guardrail stands. Amended 2026-10: transactional contact-form alerts go via Resend (best-effort; Sanity stays the source of truth). Resend domain-verification records for superbloomhouse.com were added to the Vercel DNS zone during the 2026-09-30 cutover (`send` MX/TXT, `resend._domainkey` DKIM).
- **0008 — Hybrid SSR.** `output: 'server'`; content SSR per-request, static surfaces opt into prerender. Rejected pure-static+rebuild and ISR. Its 60s-edge-cache clause is superseded by 0031.
- **0009 — UnoCSS styling.** Utility velocity + on-demand engine; CSS custom properties (Figma tokens) are the source of truth. Rejected Tailwind v4 / CSS Modules / scoped CSS. *(Token specifics: `docs/design-system.md` §1.)*
- **0014 — Semantic Surface Roles over hue-named themes.** Components express color by role; templates own role→token mapping; WCAG-AA advisory. Authoritative color model; supersedes 0013 §3 and 0010's role vocabulary. *(`docs/design-system.md` §1.)*
- **0019 — Shopify Storefront API.** Headless, Shopify-hosted checkout, cart ID in an encrypted HttpOnly cookie, no cart DB; functional-only (no approved Shop visual design). Rejected Admin API+custom checkout, Buy Button, Snipcart. *(`docs/design-system.md` §4.)*
- **0020 — Unified CMS content composition.** Two shared compositions — Content Card (listings) and Content Layout Row (detail bodies + all 5 Spine sections); unified `article` doc; Index and Our Work are both Featured + date-sorted All. Authoritative content model; fully supersedes 0018, partially supersedes 0011/0012/0016/0017, amends 0015; amended by 0022, 0027, 0030, 0034. *(`docs/design-system.md` §3.)*
- **0021 — Adopt Lenis smooth scroll.** Lenis global, synced to `gsap.ticker` + `ScrollTrigger.update`, `lerp 0.1`, disabled for reduced-motion / no-JS. Supersedes 0007's no-Lenis clause. *(`docs/design-system.md` §5.)*
- **0022 — Standardized Article model.** One Studio Articles list with a visible, required `articleType` select; slug is hidden, auto-generated at first publish and frozen thereafter; `/news/[slug]` removed. Amends 0020's hidden-`articleType` clause and 0011's composite-News clause; amended by 0027 (News body/CTA) and 0032 (`publicationDate`).
- **0023 — Allow the `null` CORS origin for the dashboard-hosted Studio.** The dashboard Studio's sandboxed crop/hotspot canvas fetches assets with `Origin: null`, which the image CDN 403s, blanking cropped images. Fix: allowlist `null` **without credentials** plus `https://www.sanity.io` **with credentials**. Acceptable while the dataset holds no sensitive data and assets are public; revoke with `sanity cors delete null`. Not a code bug.
- **0024 — Fluid display ramp, fluid vertical rhythm, canonical breakpoints.** `tokens.css` is the single source: display type rides one shared `clamp()` ramp (floor @360 → cap @1440), the top three spacing steps are fluid, breakpoints are canonical (768/1024, carousel 600/960) as `@custom-media` with desktop-first `.98` max-width bounds. Uno shortcuts and `theme.spacing` reference the token vars; components never hand-roll `vw` coefficients; `tokens.test.ts` re-derives every fluid token. Rejected: mobile-first cascade flip, fluid body/UI type, fluidizing spacing ≤96. *Amended 2026-09-30:* the Graphik subheading steps `h6` (19→24) and `editorial-title` (24→38) join the ramp — they head sections rather than carry reading copy, and a fixed 24 h6 out-weighed its mobile context (Capes caption); `body`/`caption`/`label` stay fixed. *(`docs/design-system.md` §1.)*
- **0025 — Variable font for the marquee only.** The PP Neue Corp VF powers only the Who We Are marquee, where `wdth` animates 190 → 750 on hover/focus (frozen under reduced-motion); weight/slant pinned in `PPNeueCorp-VariableUltrabold.woff2` (wght 750 / slnt 0). Static Tight Ultrabold stays site-wide; the static Compact cut is retired. Site-wide VF rejected: heavier render-critical payload for zero gain at the site's single instance.
- **0026 — Draft preview via Presentation + cookie-gated draft mode.** The Studio Presentation pane and share links run through `/api/preview/enable|disable`, which validate `sanity.previewUrlSecret` and set an `sb_preview` session cookie (`SameSite=None; Secure`, required in the cross-origin iframe). Preview swaps the Sanity client (`perspective: 'drafts'`, `useCdn: false`, viewer-scoped `SANITY_API_READ_TOKEN`), sends `Cache-Control: no-store`, forces GA off, and runs full motion behind a `PreviewBar` with an Exit affordance (8-hour cookie `Max-Age`). The Studio's preview origin is env-driven (`SANITY_STUDIO_PREVIEW_ORIGIN(S)`); pre-launch it defaults to the Vercel staging hostname because superbloomhouse.com still serves the legacy Netlify site. Rejected: staging dataset/hostname; click-to-edit overlays (the visual-editing comlink channel runs so the tool connects, but overlays stay inert — no stega encoding).
- **0027 — News as a full article with an outbound footer CTA.** News articles are full detail pages at `/articles/[slug]` like Editorial (one shared `ArticleCard`; `NewsCard` deleted). The required `destination` URL becomes a footer CTA — label from the CMS "CTA Label" field (stored as `source`), fallback "Read the full story", opens in a new tab. Slug uniqueness spans News + Editorial; Zine stays scoped per type. Amends 0022; amended by 0029 (leadMedia) and 0033 (body).
- **0028 — Observability: Sentry error aggregation with a Discord drain.** Errors aggregate in Sentry project `sbh-web` via `@sentry/astro` (production-only, privacy limits, commit-SHA releases with source maps) and alert to Discord `#site-alerts`. Everything else flows through a thin relay in `api/hooks/*`: production deploys from GitHub `deployment_status` events and content publishes from a GROQ-filtered Sanity webhook (`formSubmission` permanently excluded). Every Discord post is sanitized by construction (field allowlists, `allowed_mentions: []`, 2000-char cap). Logins, form events, Shopify/Mux activity, and preview deploys are out of scope. *(The daily GA4 traffic digest was removed 2026-09-30; `docs/observability-pipeline-spec.md`.)*
- **0029 — News leadMedia optional.** News links out to external coverage and typically carries no internal lead media, so `leadMedia` is not required for `articleType: 'news'`; Editorial and Zine still require it. Corrupt mediaBox asset arrays are filtered in the shared GROQ media projection and pruned by `migrate:prune-empty-mediabox-assets`.
- **0030 — Zine Articles leave the Index browse.** `/index` is News + Editorial only; Zine Articles surface under `/zine`. The Index Featured section stays CMS-curated, so a Zine Article can still be featured there deliberately. Amends 0020's "Index (all article types)" clause.
- **0031 — Content HTML is never shared-cached.** Cookie-gated preview (0026) is incompatible with Vercel's URL-keyed edge cache: cached published pages were served to `sb_preview` requests, hijacking the Presentation pane and share links for up to the 24h stale-while-revalidate window. Content routes now send `private, no-cache` (preview stays `no-store`); cookie-independent endpoints (sitemap) keep the public edge cache. Measured cost: a warm edge HIT saved ~80ms (~100ms vs ~180ms SSR); the real loss is cold-start masking (~2s blank tab after idle), accepted pre-launch. The path back is ISR + `bypassToken`, never shorter TTLs — any nonzero shared cache reintroduces the hijack. Amends 0008 and 0026.
- **0032 — Editable article `publicationDate`.** Visible, editable datetime on all article types so publishers can backdate or reorder items; still auto-stamps at first publish when left empty and never overwrites an editor-set value. Cards, the Studio Articles list, and the Index/related queries already sort by this field. Amends 0022's hidden/frozen clause.
- **0033 — News body removed.** News links out and carries no internal body, so `body` is hidden and not validated for `articleType: 'news'`; a News item needs only title, overview, card settings, and a destination URL. Editorial and Zine still require one. Amends 0027.
- **0034 — Work Index `itemOverrides` doubles as the All-section order.** The `workIndex` singleton's `itemOverrides` array is authoritative for `/work`'s All section: overridden Case Studies lead in list order, the rest follow `publicationDate` desc (full manual order = one override per Case Study, settings optional). Ordering is applied client-side before pagination, so `caseStudiesNewestQuery` no longer slices server-side. Amends 0020's "date-sorted All" clause for Our Work.
- **0035 — Media playback profiles: Ambient / Presented.** Every `mux.video` frame resolves to one profile; both are visibility-gated muted loops with a real `<img>` poster (Mux thumbnail at the asset's `thumbTime`, default 0) painted beneath the player. **Ambient** (default: cards, grids, background, scroll-driven media) renders no controls and is never focusable. **Presented** (`controls="full"`: Who We Are featured media and every Case Study video) adds a Media Control Bar — play/pause, token-styled ARIA scrubber (keyboard seek, ≥24px hit target), mute toggle; explicit play/pause sets a sticky `userIntent` that survives reduced-motion; the bar auto-hides after 2.5s idle while playing. `controls` is an enum (`'none' | 'compact' | 'full'`, boolean coerced for back-compat). Capes is excluded (its playhead is scroll position); Home and Zine heroes ship Ambient by design (art-directed poster canvas). *(`docs/design-system.md` §2, §5.)*
- **0036 — Gated Ambient: curated poster reveal for video cards.** `mediaBox` gains an optional `poster` image (valid only on `mux.video`, reusing the mediaBox `altText`). When set, the card is dormant — no Mux requests — until hover/focus/tap reveals it: the poster runs the Poster Punch (800ms zoom to `scale(1.12)`, 560ms fade on a 120ms delay, `--motion-ease-out`, frame clipped with `overflow: clip`), the video plays, and on leave/blur the poster settles back while the video pauses but stays loaded. On touch, the first tap reveals and the second navigates. Unset poster = plain Ambient; grids may mix gated and ambient cards. Reduced-motion: instant swap, no hover autoplay, but a tap counts as `userIntent` and plays. Amends 0035 (a playback gate, not a new `controls` value). *(`docs/design-system.md` §5.)*
- **0037 — Hosting on the Superbloom-owned Pro team; authoritative DNS moves to Vercel.** The Vercel project transferred from `lad-company` (Hobby) to the Superbloom-owned **Pro** team `superbloom` on 2026-09-29, ahead of launch; both production domains are assigned to the project and env vars carried over. The registrar is Domain.com and the incumbent GoDaddy zone is not under our control (export only), so cutover from the legacy Netlify site is a **nameserver change to Vercel DNS**, not an in-place record edit: the zone was recreated on the `superbloom` team and verified record-by-record against the live zone (2026-09-30), with stale records (`api` A, ACM validation CNAMEs, `microsite`, DomainConnect) dropped by omission. Both zones answer correctly during propagation, so there is no downtime; the untouched GoDaddy zone is the instant rollback (revert NS at Domain.com). Rejected: in-place GoDaddy record edits (no account access). Retires the Hobby-plan constraints in the observability spec (§8). *(`docs/dns-cutover-runbook.md`.)*
- **0038 — `<mux-video>` base element, lazy chunk, rendition and buffer caps.** `MediaFrame` renders `<mux-video>` from `@mux/mux-video/base` (no media-chrome, castable-video or media-tracks; defined in `MediaFrameElement.loadPlayer()`) because controls are fully custom (0035) and mux-player's 1 MB chunk, cast_sender.js and ~7k shadow-DOM nodes were the largest client cost on every media page. The chunk loads lazily: immediately for priority frames (heroes and the four above-the-fold LCP frames), on first `revealed` for gated frames (0036 — a dormant frame fetches nothing), otherwise one viewport ahead of scroll-in; a play tap before the chunk arrives is recorded as `userIntent`. `planMediaRendering` derives `maxResolution` per placement (1080p hero / split / full layoutBlock, 720p card / fixed; Capes opts down to 720p); hero `preload` is `metadata`. All frames set `_hlsConfig` as an own property before upgrade: `testBandwidth: false` plus a 20 Mbps `abrEwmaDefaultEstimate` so hls.js's estimate-based startup opens on the highest rung the player-size cap allows (playback-core defaults `capLevelToPlayerSize` on with its own `MinCapLevelController`, which also enforces `max-resolution` — never set the `cap-rendition-to-player-size` attribute, which swaps in the stock controller; measured 2026-09-30, the 1080p-capped top rung peaks at 15.8 Mbps and the 720p-capped at 6.2 Mbps, so 20 Mbps leaves the size cap as the sole startup selector; measured bandwidth replaces the estimate after the first fragment). Ambient frames add a flat 10s buffer; Presented keeps the default buffer for scrubbing. A dev-only check on `playing` warns if the estimate/test-bandwidth config or the cap default did not land; Safari/iOS ignore it all and get only the `max-resolution` URL cap. `loadPlayer()` copies the overlay poster's resolved `currentSrc` onto the element so the player poster is a cache hit. The element sets `playsinline` — custom-media-element only serializes host attributes onto the shadow `<video>`, and without it iPhone Safari throws any gesture-driven `play()` (gated-card reveal tap, Presented play/mute) into the fullscreen native player. Guardrails: base chunk budget ≤ 250 KB gz (mux-video 0.31.4 + hls.js 1.7 ≈ 235 KB; going lower means `hls.light.mjs` after auditing playback-core and the Presented scrubber); Mux preconnects are page-gated in `Layout` (`hasVideo` via `lib/containsMuxVideo.ts`), not emitted per frame. Full rationale and measurements in the `perf/*` commit messages (Lighthouse mobile review, 2026-09-29/30). *(`docs/design-system.md` §5.)*

**Superseded or amended (kept as guardrails):**

- **0007 — GSAP + ScrollTrigger only, no Motion.** The GSAP stack, no Motion/Framer, and the mandatory reduced-motion policy stand; the no-Lenis clause is superseded by 0021.
- **0010 — Section theming via scoped `--bg`/`--fg`.** The scoping mechanism stands; its hue-named/editor-selectable role vocabulary is superseded by 0014.
- **0011 — News as a single composite type.** Composite News identity, external coverage, and Tag taxonomy stand; News is part of the unified `article` model (0020), not a standalone doc.
- **0012 — Work index card model.** Case Study card media, adapter, and Tags stand; the shared `Card.astro`/`cardSize`/full-half rows/`orderRank` are gone, replaced by Content Cards (0020).
- **0013 — Who We Are model + Discipline.** The `whoWeAre` singleton with named fields and the Discipline≠Capability distinction stand; its hue-named brand roles are superseded by 0014.
- **0015 — Figma-first evidence + motion reset.** Code-as-inventory and "don't anchor to accidental motion" stand; composition evidence authority passed to 0020, motion contract lives in `docs/design-system.md` §5.
- **0016 — Compositional design-system boundaries.** Core boundaries (`SurfaceSection`/`PageGrid`/`MediaFrame`/shell, no universal model) stand; terminology and compositions updated by 0017 and 0020.
- **0017 — Case Study Spine (fixed named sections).** The 5 fixed ordered sections and Results stats stand; section-local media layouts are now the shared Content Layout Row (0020).
- **0018 — Editorial Article as a separate type.** Fully superseded by 0020 — News/Editorial/Zine share one `article` doc with an `articleType` discriminator; the discriminator became visible and editor-facing under 0022.
