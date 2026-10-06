# Superbloom — Domain Language

Ubiquitous language for the current system. Use these terms exactly; the `_Avoid_`
notes flag names that cause real confusion.

- **Design, UI, theming, and motion vocabulary** → `docs/design-system.md`.
- **Architecture and decisions** → `ARCHITECTURE.md`.

Superbloom is a production company that blends an internal creative team with a
curated external Creative Collective to produce branded entertainment, social
content, and experiential campaigns for brand clients.

## Content

- **Media Asset** — a reusable image or Mux video from a Media field. _Avoid_:
  attachment, file.
- **Poster Image** — an optional curated still paired with a Media field's
  video asset (`mediaBox.poster`). Setting it switches the frame to Gated
  Ambient mode: dormant until hover/focus/tap slides the poster away to reveal
  the video. When unset, the video autoplays ambiently and its poster is a
  Mux-generated thumbnail at the asset's thumbTime — a different thing that
  happens to share the name "poster." _Avoid_: thumbnail, cover image.
- **Media Mode** — the rendering strategy a Media Frame applies, determined
  by the asset and the Media field, in four flavors: **Image** (a still
  asset; skeleton is its own LQIP), **Ambient** (Mux video, no Poster Image,
  no controls; autoplays on visibility, poster is a Mux thumbnail at
  thumbTime, skeleton is a blurred 24px Mux thumb since Mux assets have no
  LQIP), **Gated Ambient** (Mux video *with* a Poster Image; dormant until
  revealed), **Presented** (Mux video with the full Media Control Bar and
  scrubber; user-initiated playback). _Avoid_: video type, player variant.
- **Placement** — where a Media Asset sits in a page composition, named by the
  composition that hosts it: hero, Content Card (grid or rail), Content Layout
  block, split (a two-up sharing a row), or fixed-size thumbnail. A Media
  Asset's Placement determines how large it renders across viewports; stating
  the Placement is the caller's whole job — the sizing math is not. _Avoid_:
  sizes (the HTML attribute), slot, position.
- **Work** — the portfolio section (`/work`), composed of Case Studies. _Avoid_:
  Projects, Portfolio.
- **Case Study** — a documented work engagement; belongs to one or more
  Capabilities, has a required Publication Date, and follows the Case Study Spine.
  May be followed by optional Press and a Next Project. _Avoid_: project, campaign.
- **Case Study Spine** — the five required, fixed-order narrative sections:
  Highlights, Challenge, Unexpected Insight, Big Idea, Results. _Avoid_: reorderable
  sections, page builder.
- **Results** — the measurable outcomes, shown as the final emphasized Spine
  section with required stats. _Avoid_: Outcomes, KPIs (as the section name).
- **Deliverables** — the categories of work produced for an engagement (e.g.
  Campaign Strategy, Production). _Avoid_: services, scope.
- **Next Project** — one optional Case Study curated at the foot of another.
  _Avoid_: Related Work, see also.
- **Press** — up to three optional News items surfaced after a Spine; references
  News rather than duplicating coverage. _Avoid_: coverage cards.
- **Zine** — Superbloom's editorial publication, organized into Issues. _Avoid_:
  blog, magazine.
- **Zine Issue** — one edition; contains one or more ordered Zine Articles.
  _Avoid_: volume, edition.
- **Issue Mode** — a Zine Issue's top-level presentation flag: **Full issue**
  (the designed page: hero, Letter from the Editor, article rail) or **ISSUU
  embed only** (a minimal flipbook page, for past zines that live on ISSUU and
  are not authored in the CMS). _Avoid_: linkout, external issue.
- **Super-Header** — the optional kicker above a Zine Issue's hero title (the
  `eyebrow` field, e.g. "Issue No. 5"). _Avoid_: announcement bar, masthead.
- **Zine Article** — a long-form story belonging to exactly one Zine Issue.
  _Avoid_: Editorial Article, News.
- **News** — press, announcements, and coverage of Superbloom; a full Article
  Detail page like Editorial (lead media optional — News usually links out to
  external coverage rather than hosting its own), plus a required Destination
  powering a footer CTA and an optional CTA Label. _Avoid_:
  blog, posts.
- **Destination** — the required outbound URL a News article's footer CTA links
  to.
- **CTA Label** — the optional footer CTA copy on a News article (stored in the
  `source` field, e.g. "Read on Vogue"); falls back to "Read the full story".
- **Editorial Article** — a standalone long-form, non-Zine editorial identity.
  _Avoid_: Zine Article, News.
- **Article** — the shared CMS document storing News, Editorial Articles, and Zine
  Articles, discriminated by a required, editor-visible `articleType` select.
  _Avoid_: a fourth visitor-facing type, universal content model.
- **Article Detail** — the reusable long-form presentation shared by News,
  Editorial Articles, and Zine Articles. _Avoid_: universal adapter.
- **Index Page** — the mixed Article browse at `/index` (News + Editorial;
  excludes Zine Articles, which live under `/zine`, and Case Studies). _Avoid_:
  All Work, Blog.
- **Publication Date** — the date used to sort Articles and Case Studies.
  Visible and editable on all Article types; auto-stamps at first publish only
  when left empty, and publishing never overwrites an editor-set value. Article
  cards display it, Case Study cards do not. _Avoid_: manual rank.
- **Tag** — a reusable optional editorial label on Articles and Case Studies.
  Optional and uncapped on Articles (the Article Type chip is automatic); capped
  at two on Case Studies. Cards render a capped subset regardless of how many are
  set. Distinct from Capability and Deliverables. _Avoid_: category, keyword.
- **Brand Colors (Primary / Secondary)** — a client brand's two accent colors,
  chosen per Case Study, stored as hex; used to theme that Case Study's colored
  sections. Not a fixed Superbloom palette. _Avoid_: theme color, swatch.

## Forms

- **Form Submission** — a contact/inquiry entry, stored as a Sanity record.
  _Avoid_: lead, contact (for the stored record).

## Shop

- **Shop** — the integrated e-commerce section (`/shop`); a first-class site
  section, not an external link. _Avoid_: store, external shop link.
- **Product** — a purchasable Shopify record; may have multiple Variants.
  _Avoid_: item, SKU (at the product level).
- **Variant** — a specific purchasable configuration of a Product with its own
  price/availability. _Avoid_: option, SKU.
- **Cart** — a visitor's selected Variants and quantities before checkout.
  _Avoid_: basket.

