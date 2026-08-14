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
| `studio` | `apps/studio` | Sanity Studio CMS (project `l9mhqdtj`, dataset `production`). |
| `@superbloom/schemas` | `packages/schemas` | Shared Sanity schemas + contract/migration test suite. |

`packages/schemas` is the single typed source of content shape; `apps/web` runs
`typegen` from it (`apps/web/src/sanity.types.ts`). Studio deploys independently.

## 2. Rendering and hosting

- `astro.config.mjs`: `output: 'server'`, `@astrojs/vercel` adapter, `UnoCSS`
  integration, `site: https://superbloomhouse.com`, `envDir: '../..'` (env read
  from repo root).
- Content routes are **SSR per-request** from Sanity so editor changes are live;
  static/utility surfaces opt into `prerender = true` (ADR-0008).
- Styling is UnoCSS over CSS custom properties in `apps/web/src/styles/tokens.css`
  as the token source of truth (ADR-0009). Token/type specifics: `docs/design-system.md` §1.

## 3. No database — SaaS-owned persistence (ADR-0003)

Every persistent concern is owned by a managed service; the backend is thin Astro
API glue (`apps/web/src/pages/api/*`).

| Concern | Service | Integration |
| --- | --- | --- |
| Editorial content + images | Sanity | `lib/sanity.ts`, `lib/queries.ts` (GROQ) |
| Video | Mux | `mux.video` in `mediaBox`, `<mux-player>` in `MediaFrame` |
| Commerce (products, cart, checkout) | Shopify Storefront API | `lib/shopify.ts`, `lib/shopify-cart.ts`, `pages/api/shop/*` |
| Email (newsletter + contact routing) | Mailchimp | `pages/api/contact.ts`, `pages/api/newsletter/*` |
| Form records | Sanity | `formSubmission` document |
| Hosting / SSR | Vercel | `@astrojs/vercel` |

## 4. `apps/web` layers

- **`pages/`** — routes (see §5) and API endpoints (`api/contact.ts`,
  `api/newsletter/*`, `api/shop/*`).
- **`components/`** — primitives, blocks, and per-surface compositions
  (`home/`, `case/`, `who-we-are/`, `shop/`, `cart/`, `blocks/`, `motion/`).
  Boundaries and primitives: `docs/design-system.md` §2.
- **`lib/`** — data + logic: `queries.ts` (GROQ), `shopify.ts`, `surfaceRole.ts` +
  `luminance.ts` (role → token + WCAG foreground), `contentCard.ts` /
  `contentLayout.ts` (settings resolution), `imageCropping.ts`, `seo.ts`,
  `publicationDate.ts`, and `motion/` (the motion system).
- **`lib/motion/`** — `config.ts` (tokens), `smoothScroll.ts` (Lenis), `reveal.ts`,
  `pinnedStory.ts`, `depthLayer.ts`, `horizontalRail.ts`, `routeTransition.ts`,
  `hover.ts`, `bootstrap.ts`. Motion contract: `docs/design-system.md` §5.
- **`layouts/`**, **`styles/`** (`tokens.css`).

## 5. Routes

- `/` — homepage (Fixed Composition; `homepage` singleton)
- `/index` — mixed Article browse (News + Editorial + Zine)
- `/work`, `/work/[slug]` — Case Study browse + detail
- `/who-we-are` — Fixed art-directed page (`whoWeAre` singleton)
- `/articles/[slug]` — News / Editorial Article detail
- `/zine`, `/zine/issues/[slug]`, `/zine/issues/[slug]/[article]`
- `/shop`, `/shop/products/[handle]`, `/cart`
- `robots.txt`, `sitemap.xml`, `404`

## 6. Content model (schemas)

Authoritative shape lives in `packages/schemas/src`; the intent is in
`docs/design-system.md` §3. In brief:

- **Singletons:** `homepage`, `whoWeAre`, `siteSettings`, `workIndex`, `indexPage`,
  `zineLanding`.
- **Documents:** `caseStudy`, `article` (unified News/Editorial/Zine via a
  visible, required `articleType` select), `zineIssue`, `capability`, `tag`,
  `formSubmission`.
- **Shared objects:** card settings (`cardSettings`), content composition
  (`contentLayoutRow` + `contentLayoutMedia`/`contentLayoutText`/
  `contentLayoutSpacer`/`contentLayoutCarousel`), `mediaBox`, homepage blocks.
- Each content type ships a `*Contract` validator and, where relevant, a
  `*Migration` module, with co-located tests.

---

## 7. Decisions (collapsed ADR log)

One line per decision. "Superseded" clauses are kept for the guardrail they
provide (do not re-litigate the settled part). Where a topic is now owned by
another doc, that doc is authoritative.

**Current, in force:**

- **0001 — Astro over Next.js.** Content-heavy site with few interactive islands;
  Next.js over-provisioned.
- **0002 — Sanity as CMS.** One editor surface (Mux + Shopify Connect), strong
  migration path. Rejected Directus/Payload/Contentful.
- **0003 — No database.** All persistence via SaaS; avoids backups/migrations/
  uptime for zero benefit at this scale. Rejected Postgres/Supabase/SQLite.
- **0004 — Mux for video.** First-party Sanity plugin, cheap, AV1 + thumbnails, no
  YouTube-iframe SEO cost. Rejected Bunny/Cloudflare/Vimeo/YouTube-embed.
- **0005 — Monorepo (web + studio + schemas).** Independent Studio deploys; one
  typed schema source. Rejected bundling Studio into Astro.
- **0006 — Mailchimp only, no Resend.** Client already on Mailchimp; avoid a second
  email vendor.
- **0008 — Hybrid SSR.** `output: 'server'`; content SSR per-request, static
  surfaces opt into prerender. Rejected pure-static+rebuild and ISR.
- **0009 — UnoCSS styling.** Utility velocity + on-demand engine; CSS custom
  properties (Figma tokens) are the source of truth. Rejected Tailwind v4 /
  CSS Modules / vanilla scoped CSS. *(Token specifics: `docs/design-system.md` §1.)*
- **0014 — Semantic Surface Roles over hue-named themes.** Components express color
  by role; templates own role→token mapping; WCAG-AA advisory. Authoritative color
  model; supersedes 0013 §3 and 0010's role vocabulary. *(`docs/design-system.md` §1.)*
- **0019 — Shopify Storefront API.** Headless, Shopify-hosted checkout, cart ID in
  an encrypted HttpOnly cookie, no cart DB; functional-only (no approved Shop
  visual design). Rejected Admin API+custom checkout, Buy Button, Snipcart.
  *(`docs/design-system.md` §4.)*
- **0020 — Unified CMS content composition.** Two shared compositions — Content
  Card (listings) and Content Layout Row (detail bodies + all 5 Spine sections);
  unified `article` doc; Index (all article types) and
  Our Work (Case Studies) both Featured + date-sorted All. Authoritative content
  model; fully supersedes 0018, partially supersedes 0011/0012/0016/0017, amends
  0015; its hidden-`articleType` clause is amended by 0022.
  *(`docs/design-system.md` §3.)*
- **0022 — Standardized Article model.** One Studio Articles list with a visible,
  required `articleType` select at the top of the form; News is pared to an
  outbound-link card (required `destination` URL + optional `source` outlet label;
  no body, leadMedia, or relatedItems, replacing `externalCoverage` +
  `cardDestination`); slug and publicationDate are hidden, auto-generated/stamped
  at first publish and frozen thereafter; the `/news/[slug]` detail route is
  removed. Amends 0020's hidden-`articleType` clause and 0011's composite-News
  clause; its card-only-News clause is amended by 0027.
- **0021 — Adopt Lenis smooth scroll.** Lenis global, synced to `gsap.ticker` +
  `ScrollTrigger.update`, `lerp 0.1`, disabled for reduced-motion / no-JS.
  Supersedes the no-Lenis clause of 0007. *(`docs/design-system.md` §5.)*
- **0023 — Allow the `null` CORS origin for the dashboard-hosted Studio.** The Studio
  is served through the Sanity dashboard (`www.sanity.io/@.../studio/...`; the
  `superbloom-cms.sanity.studio` host redirects into it), which runs the editor in a
  sandboxed context. Its crop/hotspot canvas reads assets via a `crossorigin` fetch
  carrying `Origin: null`; the image CDN 403s any present, non-allowlisted origin,
  blanking every cropped image (Firefox surfaces it as `NS_BINDING_ABORTED`;
  `localhost` was already allowlisted, so local dev was unaffected). Fix: allowlist
  `null` **without credentials** (anonymous read only) plus `https://www.sanity.io`
  **with credentials** for the dashboard shell. Acceptable because the `production`
  dataset holds no sensitive data and assets are already publicly fetchable; revoke
  with `sanity cors delete null` if that changes. Not a code bug — `MediaFrame`, the
  generated URLs, and the `srcset` comma theory were all ruled out.
- **0024 — Fluid display ramp, fluid vertical rhythm, canonical breakpoints.**
  `tokens.css` is the single source of truth: display type rides one shared
  `clamp()` ramp (floor @360 → cap @1440 per step, QA-tunable floors), the top
  three spacing steps are fluid (768 → 1440), and breakpoints are canonical
  (768/1024, carousel 600/960) defined once as `@custom-media` with desktop-first
  `.98` max-width boundaries, resolved by postcss-custom-media. Uno shortcuts and
  `theme.spacing` *reference* the token vars instead of re-hardcoding literals
  (fixing the spacing-literal duplication). Components never hand-roll `vw`
  font-size coefficients; `tokens.test.ts` re-derives every fluid token from the
  two curve formulas. Rejected: mobile-first cascade flip (too large a rewrite),
  fluid body/UI type (fights user zoom), fluidizing spacing ≤96.
  *(`docs/css-standardization-spec.md`; `docs/design-system.md` §1.)*
- **0025 — Variable font for the marquee only.** The PP Neue Corp collection VF
  powers only the Who We Are marquee, where the `wdth` axis genuinely animates
  (Condensed 190 → Wide 750 on hover/focus, `--motion-standard` ease-out, frozen
  under reduced-motion); weight/slant are pinned in the shipped file
  (`PPNeueCorp-VariableUltrabold.woff2`, instanced at wght 750 / slnt 0). Static
  Tight Ultrabold stays the site-wide face; the static Compact cut is retired.
  Site-wide VF adoption rejected: fluid `clamp()` already delivers resize
  smoothness with static fonts, and the VF is the heavier render-critical
  payload for zero gain at the site's single instance.
  *(`docs/marquee-variable-font-morph-spec.md`.)*
- **0026 — Draft preview via Presentation + cookie-gated draft mode on the
  production URL.** Editors preview unpublished drafts rendered by the real
  site: the Studio Presentation pane and shareable links both run through
  `/api/preview/enable|disable`, which validate the dataset-stored
  `sanity.previewUrlSecret` and set an `sb_preview` session cookie
  (`SameSite=None; Secure`, required inside the Studio's cross-origin iframe).
  Preview requests swap the Sanity client (`perspective: 'drafts'`,
  `useCdn: false`, viewer-scoped `SANITY_API_READ_TOKEN`) and send
  `Cache-Control: no-store` — the edge cache keys by URL, not cookie, and
  would otherwise serve drafts publicly. Preview quiets motion via the
  existing reduced-motion path (`data-preview` on `<html>`) and forces GA
  off. The Studio's preview origin is env-driven across dev, staging, and
  prod (`SANITY_STUDIO_PREVIEW_ORIGIN(S)`); pre-launch the deployed Studio
  defaults to the Vercel staging hostname because superbloomhouse.com still
  serves the legacy Netlify site. There is no shared env secret: rotation is
  toggling Share access in the Presentation tool. Rejected: staging
  dataset/hostname, Visual Editing overlays (needs a stega audit across
  `lib/` first). *(`docs/content-preview-spec.md`.)*
- **0027 — News as a full article with an outbound footer CTA.** News articles
  are full detail pages at `/articles/[slug]` like Editorial (required
  leadMedia + body, relatedItems available, one shared `ArticleCard` adapter
  linking cards internally; `NewsCard` deleted). The required `destination`
  URL becomes a footer CTA on the article page — "Read on {source}", falling
  back to "Read the full story", opening in a new tab — instead of the card
  link, and `source` leaves the card. Slug uniqueness spans News + Editorial
  (shared `/articles/` route); Zine stays scoped per type. Amends 0022's
  card-only-News clause.

**Superseded or amended (kept as guardrails):**

- **0007 — GSAP + ScrollTrigger only, no Motion.** *Still in force* for the GSAP
  stack, no Motion/Framer, and mandatory reduced-motion policy. Its **no-Lenis
  clause is superseded by 0021** (Lenis is now global).
- **0010 — Section theming via scoped `--bg`/`--fg`.** The scoping *mechanism*
  stands; its hue-named/editor-selectable role vocabulary is superseded by 0014.
- **0011 — News as a single composite type.** Composite News identity, external
  coverage, and Tag taxonomy stand, but there is no standalone `news` doc — News is
  now part of the unified `article` model (0020).
- **0012 — Work index card model.** Case Study card media, adapter, and Tags stand;
  the shared `Card.astro`/`cardSize`/full-half rows/`orderRank` are gone, replaced
  by Content Cards (0020).
- **0013 — Who We Are model + Discipline.** The `whoWeAre` singleton with named
  fields and the Discipline≠Capability distinction stand; its hue-named brand roles
  are superseded by 0014.
- **0015 — Figma-first evidence + motion reset.** Code-as-inventory and the "don't
  anchor to accidental motion" stance stand; CMS-composition evidence authority
  passed to 0020, and the motion contract now lives in `docs/design-system.md` §5.
- **0016 — Compositional design-system boundaries.** Core boundaries
  (`SurfaceSection`/`PageGrid`/`MediaFrame`/shell, no universal model) stand;
  terminology and shared compositions updated by 0017 and 0020.
- **0017 — Case Study Spine (fixed named sections).** The 5 fixed ordered sections
  and Results stats stand; section-local media layouts are now the shared Content
  Layout Row (0020).
- **0018 — Editorial Article as a separate type.** **Fully superseded by 0020** —
  News/Editorial/Zine share one `article` doc with an `articleType`
  discriminator (the very thing 0018 rejected); the discriminator became visible
  and editor-facing under 0022.
