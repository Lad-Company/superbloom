# Design System

Durable design and architecture intent for the Superbloom House web system.

**Authority.** This file captures *intent*: composition, surface roles, primitives,
motion, and content-model shape. It is agents-first. The **schema**
(`packages/schemas/src`) and **component code** (`apps/web/src`) are the source of
truth for field-level detail (requiredness, min/max, enums, exact props). When this
doc and the code disagree on intent, consult a human; when they disagree on a field
detail, the code wins.

**Figma authority.** The current Index composition authority is
[SBH-Temp node 1:4790](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4790&m=dev).
The primary design file is
[Superbloom R1](https://www.figma.com/design/KlL81B7rTYZUbwSeSlgrZD/-i--Superbloom---R1).

---

## 1. Visual language

- **No shadows.** Hierarchy comes from contrast, full-bleed color bands, crop,
  border, and frosted overlay — never drop shadows.
- **Surface Roles, not raw hues.** Reusable regions receive a semantic role, never
  a Superbloom brand hex. Roles: `light`, `dark`, `primary`, `secondary`
  (case-study brand colors), and the template-owned `contact` role. The `Section`
  wrapper resolves a role to `--bg`/`--fg`; foreground is auto-derived by WCAG
  relative luminance (threshold 0.5). Contrast risk is reported but overridable,
  never silently blocked.
- **Contact Band role per page:** Homepage → purple, Our Work → pink,
  Who We Are → blue, Index → green.
- **Brand hue tokens** (`tokens.css`): `--blue #3993dd`, `--green #99a224`,
  `--pink #e6c6e2`, `--purple #3f2293`, each with a paired `-fg`.

### Typography

- Display steps are **fluid** (`--type-*` in `tokens.css`, referenced by the Uno
  `type-*` shortcuts): one shared ramp, each step scaling linearly from its floor
  at a 360px viewport to its cap at 1440px, then plateauing — h1 64→200,
  h2 48→140, h3 80→120, h4 40→80, h5 / section-heading 32→56. No component
  hand-rolls a `vw` font-size; floors are QA-tunable in one place.
  (`docs/css-standardization-spec.md` §3.)
- The marquee rides the same ramp shape via `--type-marquee` (cap 200, floor held
  at 80) but keeps its own face.
- Fixed steps (fluid type would fight user zoom): `editorial-title` — Graphik
  38 / 24. `h6` 24. `h7` 32. `body` 19. `caption` 17. `label`/`eyebrow` 17
  (PP Tight).
- **PP Neue Corp Tight** is the sole compact interface/navigation face (buttons,
  tags, controls, nav). **Graphik** is reserved for editorial/reading copy.
- The **Who We Are marquee** is the *only* place the alternate PP Neue Corp display
  faces are used. TT Bluescreens is not part of the web system.

### Spacing and radius (tokens are source of truth — `tokens.css`)

- Spacing scale (px): `--space-xs-4` 8, `--space-3xs` 12, `--space-16` 16,
  `--space-2xs` 24, `--space-xs` 32, `--space-s` 40, `--space-m` 64, `--space-l` 80,
  `--space-xl` 96, then the **fluid vertical rhythm**: `--space-2xl` 80→120,
  `--space-3xl` 96→160, `--space-4xl` 120→200, scaling from a 768px viewport to
  1440px on one shared curve (floor below 768, plateau past 1440). Everything 96
  and below stays fixed so component spacing and touch targets don't fight the
  viewport. (`docs/css-standardization-spec.md` §4.)
- **Mobile section rhythm (≤767px) is a fixed 64px** between sections, built as
  32 + 32: each section pads `--space-xs` on the side facing a neighbour, and a
  section following a flush or media-hero hand-off owns the full `--space-m` 64
  on top. The fluid `2xl/3xl/4xl` rhythm takes over from the compact range up.
- Control-internal padding below the 8px floor uses the `--pad-*` sub-scale
  (4 / 6 / 10) rather than snapping compact controls up to the spacing scale.
- Layout: `--page-gutter` 24px, `--page-inset` 32px.
- Radius: `--radius-control` 6px (tags + buttons only); `--radius-media` 0 (media
  never has a radius). There is no separate field radius.
- Frosted overlay: `--frosted-layer` at `--frosted-layer-blur` 35px.

### Layout and responsive ranges

- `PageGrid`: 12 columns, 24px gutter, 32px inset.
- Three ranges: **Desktop** ≥1024, **Compact** 768–1023, **Small** <768.
  Breakpoints are canonical and defined once in `tokens.css` as custom media —
  scoped CSS writes `@media (--bp-small)`, `(--bp-below-desktop)`,
  `(--bp-desktop)` (carousel secondaries `(--bp-600)` / `(--bp-960)`), resolved by
  postcss-custom-media. The cascade is desktop-first: every max-width boundary
  uses `.98` (767.98 / 1023.98) so ranges can't overlap or gap at the exact px.
  (`docs/css-standardization-spec.md` §5.)
- Below 1024px: ordinary Content Cards go full-width, Info below; two-block detail
  rows stack in authored order; explicit carousels remain narrow.

---

## 2. Primitives

Shared, composable building blocks. Each has a strict boundary ("does not own").

- **`SurfaceSection`** — full-width band establishing a Surface Role, readable
  foreground, and shared vertical rhythm. Composes modules; does not own their
  content or layout.
- **`PageGrid`** — the 12-col grid. Owns column math only.
- **`MediaFrame`** — reusable image/video container. Owns sizing, crop, overlays,
  loading priority, visibility-aware playback (hidden/offscreen/background-tab
  video is always paused). Does not know its parent's content type or destination,
  and does not construct routes.

  **Playback profile** is a `controls` enum with three values:

  - `'none'` (default — **Ambient**) — muted loop, visibility-gated, paused on
    offscreen/background-tab/reduced-motion/`active=false`. No control DOM, not
    focusable, not in the tab order. Cards, grids, background media, the
    pointer-follow cluster, and Capes.
  - `'compact'` — single play/pause button free-floating bottom-right
    (40px circle, `surface-wipe`, `aria-pressed`). Existing boolean default for
    mid-page featured videos.
  - `'full'` (**Presented**) — Media Control Bar pinned to the bottom inset of
    the media: play/pause (left) | scrubber (flex:1, role=slider, keyboard
    ±5s/Home/End) | mute toggle (right edge). Plays muted loop by default; the
    bar is the user-override surface, not an alternative to the ambient gating.
    Auto-hides after 2.5s of pointer/focus idle while playing; reappears on any
    pointer movement, focus, or pause; always visible under reduced-motion user
    intent and when the user is paused. Today: WhoWeAre featured media + Case
    Study lead media (full-bleed video only).

    > Surface assignment deviation from the spec: `docs/media-playback-spec.md`
    > §2 lists the **Home hero (3:2)** and the **Zine hero (16:9)** as
    > Presented. They ship as Ambient today. Decision rationale: the hero is
    > an art-directed poster canvas, not a watchable clip — a play/pause or
    > scrubber would compete with the headline/CTA composition that already
    > fixes the bottom band. Re-evaluate per Figma if/when the hero becomes a
    > clip the reader is expected to scrub. Annual reviewer: when re-litigating,
    > PageHero's media-mode path is the single change point — no other surface
    > flips.
- **`PageHero`** — the single page-header block. One shared H1 (200px/78%
  desktop, `clamp(64px, 18vw, 160px)` below 1024, ≤4 lines) with three modes
  derived from props: text (default), media (home 3/2, zine 16:9 + optional
  Super-Header kicker), case (eyebrow + tags).
- **`Button`** — variants solid / translucent / outline / icon. The canonical
  contained-control affordance.
- **`Icon`**, form controls, **`TagList`** (overlay + inline), **`Metric`**.

**Composition boundaries.** Compose `SurfaceSection` + `PageGrid` + a named module.
No configurable mega-section. Never duplicate shell modules per page. Content
adapters (e.g. `NewsCard` → `EditorialCard`) own content translation and route
construction; `MediaFrame` stays presentation-only. Resolve Surface Roles in page
compositions, not inside reusable modules.

---

## 3. Content model and composition

Field-level constraints live in `packages/schemas/src`. This is the shape.

### Two page-composition models

- **Fixed Composition** — the template owns module order and allowed variants; CMS
  fields supply content into an art-directed structure (homepage, Who We Are,
  Case Study).
- **Editorial Composition** — CMS authors arrange an ordered, allowlisted set of
  modules (modular browse/landing surfaces).

### Content Card

Listing/browse composition = a `MediaFrame` + a fixed Info block from a
content-specific adapter (News, Editorial Article, Zine Article, Case Study).
Three settings:

- **Card Width** — fraction of the container the whole card occupies:
  `1/4, 1/3, 1/2, 2/3, 3/4, full`. Full width below 1024px except in explicit
  carousels.
- **Media Aspect Ratio** — `intrinsic, 1:1, 4:5, 9:16, 3:2, 16:9, 2:1`.
- **Info Position** — `below, left, right`. Left/right require Card Width ≥ `1/2`
  and revert to `below` on mobile.

**Settings inheritance:** per-item override → list default → content default →
global default. Featured lists require all settings explicitly.

**Badges (top-left of the Media Frame):** mixed Article lists show the Type badge +
at most 1 Tag; type-specific lists hide the Type badge and show up to 2 Tags;
Case Study cards show up to 2 Tags and no Type badge.

### Content Layout Row (detail-page composition)

Shared by Article bodies and all five Case Study Spine sections. A row holds Media,
Text, or Spacer blocks with authored fractional widths; two content blocks total
`full`; a single narrow block aligns left/center/right; rows may be full-bleed
eligible. Distinct from Content Card — it does not use card width/ratio/info
controls.
> Drift note: schema (`contentLayoutRow.ts`) allows 1–3 blocks and includes a
> `contentLayoutSpacer` type; confirm the spacer + max-3 was intended (earlier docs
> said 1–2 Media/Text only).

### Article (unified editorial model)

One `article` document stores **News**, **Editorial Articles**, and **Zine
Articles**, discriminated by a hidden `articleType`. The discriminator selects the
Studio view, create action, route, and content adapter:

- News → `/news/[slug]` (may link to an internal detail or a validated external
  primary-coverage URL, opening in a new tab).
- Editorial → `/articles/[slug]`.
- Zine → `/zine/issues/[issue-slug]/[article-slug]` (resolved only through issue
  membership).

### Index vs Work (browse pages)

- **`/index`** — mixed browse of published News + Editorial + Zine Articles
  (excludes Case Studies). Optional Featured (1–4, manually ordered, masonry) then
  a required All section (remaining matching articles). The Index singleton may set
  one Tag as a CMS source rule (not a visitor-facing filter). Cards show the Type
  badge + ≤1 Tag and the publication date.
- **`/work`** — published Case Study browse. Optional Featured (1–4, manual,
  masonry) then required All. Sort by publication date, newest default; no Tag
  filter. Case Study cards show 0–2 Tags, no Type badge, and no date.

Both: first page SSR, a no-JS Load More baseline (cursor query params), endless
scroll as progressive enhancement.

### Case Study Spine

Five required, code-owned sections in fixed order, non-reorderable/non-omittable:
**Highlights → Challenge → Unexpected Insight → Big Idea → Results**. Names,
eyebrows, nav labels, and order stay in lockstep.

- **Hero:** client eyebrow + large title + Capability tags (outlined pills, wrap),
  on the case brand color. Optional lead media after the hero. (Replaces the old
  Year/Industry/Deliverables meta row.) Background = `primary` Surface Role.
- Each narrative section holds ordered Content Layout Rows (`mediaLayouts`).
- **Results** additionally keeps required stats (1–4, each value + label) plus
  supporting rows (`supportingRows`); its surface is set by `backgroundColor`
  (`primary` / `secondary`, default `primary`).
- **Press:** 0–3 unique News items, rendered only if at least one resolves.
- **Next Project:** 0–1 non-self Case Study.

### Zine

- **Zine Issue** is the publication authority: an ordered `articles[]` of
  `articleType == "zine"`, and exactly one format — an ISSUU Flipbook URL *or* a
  PDF asset (not both, not neither). Membership/order live only on the Issue; a
  Zine Article publishes only when exactly one Issue references it.
- Issue owns card media, hero media, an optional **Super-Header** kicker above
  the hero title (`eyebrow`, e.g. "Issue No. 5"), and a **Letter from the
  Editor** section (media, heading, body, editable CTA label defaulting to
  "Read the Zine").
- Routes: `/zine` (current issue via the `zineLanding` singleton),
  `/zine/issues/[slug]` (archive). The current issue's archive URL redirects to
  `/zine` and is excluded from the sitemap.
- Membership can be audited: `pnpm --filter studio audit:zine`.

### Tag

Small pill, optional editorial taxonomy, distinct from Capability, Deliverables,
and the Type badge. 0–2 per Article/Case Study. Rendered top-left of the Media
Frame, inheriting page color mode.

### FAQ

Belongs to the fixed Who We Are composition (`whoWeAre.faqs[]`), not a general
block. Two-column desktop / stacked mobile accordion built on `<details>`/`<summary>`
with a `+` toggle, accessible, with no-JS and reduced-motion fallbacks.

### Card Carousel

Type-specific browse rail (e.g. News). One list default + per-item partial
overrides. CSS scroll-snap and keyboard focus first; arrow controls are an
enhancement. The explicit responsive exception: cards stay narrow on mobile with
Info always below.

---

## 4. Page and module contracts

### Homepage (Fixed Composition)

`homepage` renders these blocks in order via `HomepageComposition.astro`:
Hero → News → Parallax → Capabilities (Capes) → Our Work → Creative Collective
(Why) → Zine → Contact.

- **Hero** (`PageHero.astro`, media mode) — full-bleed hero: background media
  with an overlaid headline (`display-1`) and intro, headline left ~2/3, intro
  bottom-right.
- **Capes** (`Capes.astro`) — capability grid (headline + short description),
  3-col desktop / 2-col mobile, up to 6 capabilities; inherits page color mode.
  Reference recipe for Pinned Storytelling + Depth Layer motion.
- **Home Zine** — promotes a specific Zine Issue with its own promo copy/media/CTA
  (does not mirror the current Issue). Fixed brand color **Green `#99a224`**. CTA
  routes to `/zine` if the promoted issue is current, else to
  `/zine/issues/[slug]`.

### Who We Are (Fixed, art-directed — singleton `whoWeAre`)

Fixed section order: Hero (`PageHero`) → Featured media → Marquee → Intro statement →
Fact cards (`FactCardGrid`) → Advantage headline + blocks (`TextMedia`) →
Disciplines (`DisciplineList`) → 2-up CTAs (`TwoUp`, max 2) → FAQ (`Faq`, max 6) →
Contact (blue) → Footer. **Disciplines** (the breadth list) are distinct from the
five named Capability offerings. The Marquee is the sole place the alternate
PP Neue Corp display faces appear.

### Shared Site Shell

Persistent structure composed around each page's unique content: `Navigation`,
`ContactBand`, `Footer`. `Navigation` is rendered once by `Layout` via the
page's `navRole` prop; pages no longer hand-render it. `siteSettings` supplies
the four social links (Instagram, LinkedIn, Vimeo, YouTube). Shop is a
first-class `/shop` route, not a settings link.

### Shop (functional; no approved visual design yet)

- **Shopify is the source of truth for products** — there is no Sanity product
  schema.
- **Cart:** store only the Shopify cart ID in an encrypted, HttpOnly, Secure,
  SameSite=Lax first-party cookie. No server session or DB. An invalid/expired ID
  silently creates a new cart. **Never expose or log** the cart `id` or
  `checkoutUrl` to client JS; the client cart view returns only `lines`,
  `subtotalAmount`, `itemCount`, and a fixed checkout path; checkout is a
  same-request server redirect.
- **Endpoints:** mutations are same-origin POST only, verifying
  `Origin`/`Sec-Fetch-Site`, rejecting unbounded quantities and malformed Shopify
  IDs. Shopify tokens stay server-side. Product listing batches 24/page with a
  no-JS Load More baseline. Policy links come from Shopify Shop policy objects.
- Shop components carry **functional approval only** — no visual sign-off.

### Forms and observability

- The contact form creates a Sanity `formSubmission` record and routes a Mailchimp
  `contact-form` notification. It **must not** auto-subscribe the submitter; the
  newsletter is a separate email-only Mailchimp subscribe.
- **Never log** customer PII (email, address, phone, payment) or the cart ID to
  Sentry.
- `/cart` is `noindex`; the current Zine issue archive URL redirects to `/zine` and
  is sitemap-excluded.

---

## 5. Motion — Controlled Anticipation

The sitewide motion system: responsive interaction feedback paired with snappy,
linear reveals, expressed only through reusable primitives (never page-specific
animation). Motion is **built and active** (`apps/web/src/lib/motion/`), not
deferred.

**Non-negotiables.** GSAP + ScrollTrigger + the shared **Lenis** smooth-scroll
module (per ADR-0021, which supersedes ADR-0007's no-smooth-scroll clause). No
Motion/Framer. Every timeline lives inside `gsap.matchMedia()` with a
reduced-motion path. Animate only transforms / opacity / clip-path / CSS vars —
never top/left/width/height/margin/padding. No whole-page generic fades. Motion
never obscures readable type. Reuse a primitive before writing a page-local timeline.

**Tokens** (`tokens.css` / `config.ts`):
- Durations: instant 120ms (press/state), quick 240ms (hover + all reveals),
  standard 480ms (local UI), deliberate 800ms (stat count-ups, Route
  Transitions, chapter media crossfades), chapter 1200ms+ (Pinned
  Storytelling only).
- Easing: `ease-out cubic-bezier(0.22,0.8,0.2,1)` for interaction feedback
  (hover/press/state); `ease-in-out cubic-bezier(0.65,0,0.35,1)` /
  `power3.inOut` for Route Transitions; `back.out(1.2)` (fast rise, slight
  overshoot settle) for Type/Stat Reveals; linear (constant speed) for stat
  count-ups and Pinned Storytelling scrubs. No elastic or large-spring bounce
  beyond the reveal settle.
- Staggers: tight 12ms, standard 24ms.

**Primitives.**
1. **Text Link** — Underline Draw.
2. **Contained Control** — Surface Wipe + `scale(0.98)` press. The Media Control
   Bar on Presented `MediaFrame` instances (.media-controls__btn) inherits
   this primitive and adds an `auto-hide` recipe: opacity fade via
   `--motion-quick`, schedule on play, cancel-and-reschedule on any
   `pointermove` / `pointerdown` / `focusin` (the events bubble from any
   control or scrubber interaction up to the host `<media-frame>` element).
   Always show while paused; show under reduced-motion so the user can opt
   in via the play button. Knob grow / track height grow mirror the same
   recipe inside the scrubber.
3. **Type Reveal** — lines/words by default; chars reserved for hero/route
   moments. Units rise under an overflow clip with no opacity fade and land on
   a slight overshoot settle (`back.out`), springing rather than smacking to a
   stop. Stat Reveal entrances follow the same rule; count-ups stay linear.
4. **Three-Phase Loading** — skeleton → single progress cue → content release;
   only for waits >400ms; never spinner + skeleton together.
5. **Route Transition** — full-viewport, reserved exclusively for navbar
   destinations; other navigations keep local motion.
6. **Pinned Storytelling** — bounded ScrollTrigger chapter sequence (2–4 chapters,
   linear scrub, cleanup on refresh). Allowed on Home, Work, Who We Are,
   News/Press, and Zine navbar destinations. Shop, Cart, slug detail pages, and
   forms use normal scrolling.
7. **Depth Layer** — max 3 planes; never parallax body text or controls.

On load the hero reveal owns the first frames: heavy scroll systems (Capes pin,
parallax rAF, stat triggers) and priority video player boot all wait for Layout's
idle-dispatched `sbh:motion-deferred`, and priority video holds a further fixed
500ms beat so the reveal's tail is clear too; the video's eager poster holds the
hero frame until the player can present.

**Recipes** compose primitives for a surface: Navbar Route, Content Card, Home/Index
Chapter, Case Study Chapter, Form/Shop. An **Art-Directed Hero** may add one-off
choreography on top when a documented brief requires it, still inheriting the shared
accessibility, loading, hover, and cleanup rules.

**Reduced motion** preserves state changes, color changes, and link underlines while
removing pinning, scrubbing, parallax, blur, and delayed/staggered reveals.

---

## 6. Known unbuilt patterns

Described in Figma/design intent but not implemented; do not treat as current. All
would use the `Button` primitive, and none belong in Article bodies or the Case
Study Spine (those use Content Layout Row).

- **Crosslink** — atomic cross-nav unit: square `MediaFrame` + display heading +
  CTA. Build once; compose 2-up from it. No schema/component today.
- **2-up** — two side-by-side Crosslink cards for cross-navigation on About/landing
  pages. Needs a new block type. (A `TwoUp.astro` exists but is the Who We Are CTA
  module, not this pattern.)
- **Text-Media 50/50 ("Home-Why")** — homepage text+media split (headline, body,
  CTA, 4:5 media). Would need a new `homepage` block type. (`HomeFeature.astro`
  exists but is unwired — see the code-drift list.)
