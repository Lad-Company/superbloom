# Superbloom — Domain Language

Ubiquitous language for the current system. Use these terms exactly; the `_Avoid_`
notes flag names that cause real confusion.

- **Design, UI, theming, and motion vocabulary** → `docs/design-system.md`.
- **Architecture and decisions** → `ARCHITECTURE.md`.

Superbloom is a production company that blends an internal creative team with a
curated external Creative Collective to produce branded entertainment, social
content, and experiential campaigns for brand clients.

## People and Collective

- **Creative Collective** — Superbloom's curated network of external Creators; a
  core business differentiator, not a department or internal team. Currently
  surfaced as a homepage section only. _Avoid_: agency network, freelancer pool.

## Offerings

- **Capability** — a named service offering. Current set: Creative, Branded
  Entertainment, Social Studios, All-Media Productions, Brand Salon. Modeled as
  `capability` documents. _Avoid_: service, offering, practice area.
- **Discipline** — a granular area of expertise shown on Who We Are (strategy,
  creative, experiential, social, production, etc.). A bespoke list on the
  `whoWeAre` singleton, distinct from Capability. _Avoid_: Capability.
- **Brand Salon** — a Capability: a structured live workshop (~4h) bringing the
  Creative Collective and a client team together to solve a brief in real time.
  Always a Capability entry, never a standalone type. _Avoid_: Workshop, Salon.

## Content

- **Media Asset** — a reusable image or Mux video from a Media field. _Avoid_:
  attachment, file (except a Zine PDF).
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
- **Zine Article** — a long-form story belonging to exactly one Zine Issue.
  _Avoid_: Editorial Article, News.
- **News** — press, announcements, and coverage of Superbloom; may combine an
  own writeup with external coverage links. _Avoid_: blog, posts.
- **Editorial Article** — a standalone long-form, non-Zine editorial identity.
  _Avoid_: Zine Article, News.
- **Article** — the shared CMS document storing News, Editorial Articles, and Zine
  Articles, discriminated by a required hidden `articleType`. _Avoid_: a fourth
  visitor-facing type, universal content model.
- **Article Detail** — the reusable long-form presentation shared by the three
  editorial identities (distinct routes and adapters). _Avoid_: universal adapter.
- **Index Page** — the mixed Article browse at `/index` (News + Editorial + Zine;
  excludes Case Studies). _Avoid_: All Work, Blog.
- **Publication Date** — the required date used to sort Articles and Case Studies.
  Article cards display it; Case Study cards do not. _Avoid_: manual rank.
- **Tag** — a reusable optional editorial label on Articles and Case Studies; at
  most two. Distinct from Capability and Deliverables. _Avoid_: category, keyword.
- **Brand Colors (Primary / Secondary)** — a client brand's two accent colors,
  chosen per Case Study, stored as hex; used to theme that Case Study's colored
  sections. Not a fixed Superbloom palette. _Avoid_: theme color, swatch.

## Forms

- **Form Submission** — a contact/inquiry entry, stored as a Sanity record and
  routed via Mailchimp. _Avoid_: lead, contact (for the stored record).

## Shop

- **Shop** — the integrated e-commerce section (`/shop`); a first-class site
  section, not an external link. _Avoid_: store, external shop link.
- **Product** — a purchasable Shopify record; may have multiple Variants.
  _Avoid_: item, SKU (at the product level).
- **Variant** — a specific purchasable configuration of a Product with its own
  price/availability. _Avoid_: option, SKU.
- **Cart** — a visitor's selected Variants and quantities before checkout.
  _Avoid_: basket.

## Deferred / not built

These are part of Superbloom's model or roadmap but have no schema or route yet.
Do not describe them as implemented.

- **Team Member / People page** — internal staff directory.
- **Creator / Creators page** — a roster of Creative Collective members.
- **Case Study → Creators** — crediting contributing Creators on a Case Study.
- **Video Library** — a dedicated reusable-video workspace; today video is
  selected or uploaded per Media field.

## Example dialogue

> **Dev:** Is Brand Salon its own nav section? — **Expert:** No, it's a Capability.
> **Dev:** Does `/index` include Zine Articles? — **Expert:** Yes: News, Editorial,
> and Zine. It excludes Case Studies (those live in Work).
> **Dev:** Where do we link the Shop? — **Expert:** Main nav. It's a first-class
> section, not an external link.
