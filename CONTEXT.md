# Superbloom

Superbloom is a production company that blends an internal creative team with a curated external Creative Collective to produce branded entertainment, social content, and experiential campaigns for brand clients.

## Language

### People and Roles

**Team Member**:
A member of Superbloom's internal staff. Shown on the People page.
_Avoid_: Employee, creator (when referring to internal staff), talent

**Creator**:
A member of the Creative Collective, an external collaborator curated and championed by Superbloom. Shown on the Creators page.
_Avoid_: Team member, freelancer, talent, contributor

**Creative Collective**:
Superbloom's curated network of external Creators. The Collective is a core differentiator in Superbloom's business model. It is not a department or an internal team.
_Avoid_: Agency network, freelancer pool, contractor list

### Offerings

**Capability**:
One of Superbloom's named service offerings. Current capabilities: Creative, Branded Entertainment, Social Studios, All-Media Productions, Brand Salon.
_Avoid_: Service, offering, practice area

**Discipline**:
A granular area of expertise shown on the Who We Are page (e.g. strategy, creative, experiential, social, production, entertainment, media, creators). Describes the breadth of what Superbloom does. Modeled as a bespoke list on the `whoWeAre` singleton and not referenced elsewhere.
_Avoid_: Capability (when referring to this breadth list; a Discipline is not a productized service offering)

**Brand Salon**:
A specific Capability: a structured live workshop in which Superbloom brings the Creative Collective and a client team together to solve a brief in real time (typically 4 hours). Always treated as a Capability entry, not a standalone content type.
_Avoid_: Workshop, Brand Workshop, Salon

### Content

**Media Asset**:
A reusable image or Mux video selected or uploaded from a Media field. Images use Sanity's native asset picker. Field-level Mux upload and selection remain available.
_Avoid_: Attachment, file (unless referring specifically to a Zine PDF)

**Video Library**:
A proposed dedicated Studio workspace for reusable videos. It is deferred and must not be described as currently implemented. Editors continue to select or upload Mux video from individual Media fields.
_Avoid_: Describing a dedicated Videos tab or central Video Library as implemented

**Work**:
The portfolio section of the site. Work is composed of Case Studies.
_Avoid_: Projects, Portfolio, Campaign archive

**Case Study**:
A documented work engagement. A Case Study belongs to one or more Capabilities, has a required Publication Date, and may reference Creators who contributed. Its narrative anatomy is the Case Study Spine. It may be followed by optional Press and a Next Project.
_Avoid_: Project, campaign, post (when referring to Work content)

**Case Study Spine**:
The five required narrative sections of every Case Study: Highlights, Challenge, Unexpected Insight, Big Idea, and Results. The names, visible eyebrows, navigation labels, and order stay in lockstep. Authors compose Content Layout Rows inside every section. Results also retains its required stats treatment.
_Avoid_: Reorderable sections, flexible page builder, Article body

**Results**:
The measurable outcomes of a Case Study (e.g., sales lift, reach), shown as the final emphasized section of the Case Study Spine. Distinct from Highlights, which is the headline framing of the engagement.
_Avoid_: Outcomes, metrics, KPIs (when referring to the Case Study section)

**Deliverables**:
The categories of work Superbloom produced for an engagement (e.g., Campaign Strategy, Production).
_Avoid_: Services, scope, outputs

**Next Project**:
One optional Case Study explicitly curated at the foot of another Case Study.
_Avoid_: Related Work, more projects, see also, recommendations

**Press**:
Up to three optional News items surfaced after a Case Study Spine. Press references News items rather than duplicating coverage links.
_Avoid_: Case Study press links, coverage cards

**Zine**:
Superbloom's editorial publication, organized into Issues.
_Avoid_: Blog, magazine, editorial

**Zine Issue**:
A single edition of the Zine. Each Issue contains one or more ordered Zine Articles, and each Zine Article belongs to exactly one Issue.
_Avoid_: Volume, edition, post

**Zine Article**:
A long-form story belonging to exactly one Zine Issue. The complete authored sequence of an Issue's Zine Articles forms that Issue's table of contents.
_Avoid_: Editorial Article, News, post

**News**:
Press, announcements, and editorial coverage of Superbloom. A single News item may combine Superbloom's own long-form writeup and links to external coverage of the same story. News is distinct from both the Zine and Editorial Articles; editors choose between News and Editorial Article according to editorial intent rather than an enforced semantic rule.
_Avoid_: Blog, posts (when referring to News content)

**Editorial Article**:
A standalone long-form, non-Zine editorial identity. Editorial Articles share Article storage with News and Zine Articles, while retaining a distinct Studio view, create action, route, and content adapter.
_Avoid_: Zine Article, News, generic Article

**Index Page**:
The mixed Article browse page at `/index`. It contains News, Editorial Articles, and Zine Articles. Its optional Featured section is manually curated; its required All section includes every other published Article, sorted by Publication Date and optionally narrowed by one CMS-selected Tag. It excludes Case Studies.
_Avoid_: All Work, Work index, Blog

**Article Detail**:
A reusable long-form presentation shared by Zine Articles, News items, and Editorial Articles. The three editorial identities use shared Article storage with a hidden `articleType` discriminator, distinct Studio views and create actions, distinct routes, and separate content adapters.
_Avoid_: Zine Issue, collapsing editorial identities, universal content adapter

**Article**:
The shared CMS document that stores News, Editorial Articles, and Zine Articles. Its required hidden `articleType` discriminator selects the editorial identity, Studio view, route, and adapter behavior.
_Avoid_: A fourth visitor-facing content type, universal content model

**Publication Date**:
The required date used to sort Articles and Case Studies in browse pages. Article cards display it; Case Study cards do not.
_Avoid_: Manual rank, arbitrary Work order

**Tag**:
A reusable optional editorial label applied to Articles and Case Studies for categorization. Content may have at most two Tags. Mixed Article lists show the required Type badge plus at most one Tag; type-specific lists hide the Type badge and show up to two Tags. Case Study cards show up to two Tags and no Type badge. Labels appear at the top-left of the Media Frame. A Tag is distinct from a Capability and from Deliverables.
_Avoid_: Category, capability, keyword

### Forms

**Form Submission**:
A contact or inquiry entry submitted by a site visitor, mirrored to Sanity as a permanent record and routed via Mailchimp.
_Avoid_: Lead, contact, inquiry (when referring to the stored record)

### Shop

**Shop**:
The integrated e-commerce section of the site. It contains Products and the Cart and leads customers into checkout. The Shop is a first-class site section, not an external destination.
_Avoid_: Store, external shop link

**Product**:
A purchasable record in the Shop. A Product may have multiple Variants.
_Avoid_: Item, SKU (when referring to the product-level entity)

**Variant**:
A specific purchasable configuration of a Product (e.g., "Small / Red"), with its own price and availability.
_Avoid_: Option, SKU

**Cart**:
A visitor's selected Variants and quantities before checkout.
_Avoid_: Basket

### Brand and Theming

**Brand Colors (Primary / Secondary)**:
A client brand's two accent colors, chosen per Case Study, used to theme that Case Study's colored sections (e.g., the hero takes Primary, Results may take Secondary). These are the brand's identity colors, not a fixed Superbloom palette. Stored as hex strings in the CMS.
_Avoid_: Theme color, highlight color, swatch

**Section Theme**:
A role enum (`light`, `dark`, `primary`, `secondary`) carried by a themed section or module. Resolved to `--bg`/`--fg` CSS custom properties by the `Section` wrapper component. `primary`/`secondary` resolve to the case study's brand colors; foreground is auto-derived by WCAG relative luminance (threshold 0.5).
_Avoid_: Color mode, variant, style

**Surface Role**:
The semantic color purpose assigned to a reusable UI region. Shared components receive a surface role, never a raw Superbloom hue. A page palette maps a role to a Superbloom brand hue, while Case Study roles may resolve to its Primary or Secondary Brand Color.
_Avoid_: Component color, raw hue prop, theme color

**Compact Interface Type**:
PP Neue Corp Tight is the sole typeface for all compact interactive and navigational text, including buttons, tags, controls, and navigation. Graphik is reserved for editorial and reading copy; TT Bluescreens is not used in the web system.
_Avoid_: Label font, UI font, TT Bluescreens

**Marquee Display**:
The only approved use of PP Neue Corp Condensed and Wide. These faces alternate within the Who We Are marquee and are not general-purpose display or interface type roles.
_Avoid_: Alternate display system, marquee font

**Motion Language**:
The sitewide behavior system named Controlled Anticipation. It pairs responsive interaction feedback with deliberate, cinematic reveals. It is expressed through reusable motion primitives and never through page-specific animation conventions.
_Avoid_: Animation style, effects package, page motion

**Text Link**:
An inline or navigational text affordance. Its canonical hover treatment is Underline Draw.
_Avoid_: Button, control

**Contained Control**:
A button, menu item, clickable card, or other bounded interactive surface. Its canonical hover treatment is Surface Wipe.
_Avoid_: Text link

**Three-Phase Loading**:
The canonical async sequence: immediate structural skeleton, a single visible progress cue, then a content release that inherits the destination's entry motion. Indeterminate micro-actions under 400ms may omit the sequence.
_Avoid_: Generic spinner, loading animation

**Route Transition**:
A full-viewport navigation transition reserved exclusively for destinations reached from the Shared Site Shell's primary Navigation. Other interactions retain local motion.
_Avoid_: Page fade, universal navigation transition

**Pinned Storytelling**:
A ScrollTrigger-controlled chapter sequence allowed on the home page and the Work, Who We Are, News & Press, and Zine navbar destinations. Shop, Cart, slugged detail pages, forms, and other minor routes use normal document scrolling.
_Avoid_: Scroll jacking, sitewide pinning

**Reduced-Motion Feedback**:
The accessible motion mode that preserves immediate state changes, color changes, and link underlines while removing pinning, scrubbing, parallax, blur, and delayed or staggered content reveals.
_Avoid_: Motion off, full-motion fallback

**Motion Recipe**:
An approved composition of shared motion primitives applied by a page or component. Recipes supply content-specific sequencing without reimplementing motion behavior.
_Avoid_: Page-specific animation script, motion preset

**Art-Directed Hero**:
A designated hero section that may add one-off choreography on top of the Motion Language when a documented creative brief requires it. It still inherits the shared accessibility, loading, hover, and cleanup rules.
_Avoid_: Unconstrained custom animation, exception page

**Motion Tempo**:
The semantic duration scale for Controlled Anticipation: instant (120ms) for press and state feedback, quick (240ms) for hover, standard (480ms) for local reveals, deliberate (800ms) for type and Route Transitions, and chapter (1.2s+) only for Pinned Storytelling.
_Avoid_: Arbitrary component timing, duration token

**Motion Easing**:
The Controlled Anticipation easing discipline: decisive ease-out for entrances and local feedback, `power3.inOut` for Route Transitions, and linear scrub only for Pinned Storytelling. Elastic, bouncy, and playful easing are excluded from shared primitives.
_Avoid_: Spring motion, arbitrary easing

**Media Frame**:
The reusable visual container for image or video media. It establishes sizing, crop, media overlays, loading priority, and visibility-aware playback without knowing the content type or destination of its parent. Hidden video is always paused, including inactive media, offscreen media, and media in a background browser tab.
_Avoid_: Card media, thumbnail component, image card

**Content Card**:
A listing and browse composition that combines a Media Frame with a fixed Info block supplied by a content-specific adapter. It is used by News, Editorial Article, Zine Article, and Case Study cards. Each card has Card Width, Media Aspect Ratio, and Info Position settings. Card Width applies to the whole card; Info Position is below, left, or right of media. Content adapters remain separate rather than forming a universal content model.
_Avoid_: Editorial Card, universal card, using card controls for detail-page layout

**Card Width**:
The fraction of the listing container occupied by a whole Content Card, including media and its Info block. Allowed desktop values are `1/4`, `1/3`, `1/2`, `2/3`, `3/4`, and `full`. Cards become full width below 1024px except in explicit horizontal carousels.
_Avoid_: Media width, full/half-only card size

**Info Position**:
The placement of a Content Card's fixed Info block relative to its media: `below`, `left`, or `right`. Left and right require Card Width of at least `1/2`; all positions become below on mobile.
_Avoid_: Detail-page block alignment, freely authored card metadata

**Surface Section**:
A full-width page band that establishes a Surface Role, readable foreground, and shared vertical rhythm. It composes content modules such as a Contact Band or Results rather than owning their content or layout.
_Avoid_: Mega-section, page section component

**Shared Site Shell**:
The persistent page structure shared across the site: Navigation, Contact Band, and Footer. Individual pages compose these modules around their unique content.
_Avoid_: Chrome, boilerplate, page copy

**Fixed Composition**:
A page content model in which the template owns module order and allowed variants. CMS fields supply content to an art-directed narrative structure but do not rearrange it.
_Avoid_: Static page, hardcoded page

**Editorial Composition**:
A page content model in which CMS authors arrange an ordered, allowlisted set of content modules. Used for modular landing pages where order is an editorial decision.
_Avoid_: Page builder, free-form layout

**Content Layout Row**:
The shared detail-page composition used in Article bodies and inside all five fixed Case Study Spine sections. A row contains one or two Media or Text blocks, with authored fractional widths. Two-block widths total `full`; one narrow block may align left, center, or right. This composition reuses Media Asset and Media Frame but does not share Content Card layout controls.
_Avoid_: Content Card, page builder, reorderable Case Study section

**Article Body**:
The ordered sequence of Content Layout Rows authored for News, Editorial Articles, and Zine Articles. Editorial and Zine bodies are required; a News body is optional when external coverage supplies its content.
_Avoid_: Legacy Body Blocks, Case Study Spine

## Example dialogue

> **Dev:** The new filterable page, is that for Team Members or Creators?
> **Domain expert:** Creators. The Creative Collective. They're external, not on our team.
> **Dev:** Got it. And the People page?
> **Domain expert:** That's Team Members, the internal Superbloom staff.
> **Dev:** Is Brand Salon its own nav section or under Capabilities?
> **Domain expert:** Under Capabilities. It's one of our Capabilities. We might document more over time but the type is the same.
> **Dev:** Does the Index Page include Zine Articles?
> **Domain expert:** Yes. Index includes News, Editorial Articles, and Zine Articles. Editors may narrow the All section with one optional Tag.
> **Dev:** Where do we link to the Shop?
> **Domain expert:** It's in the main nav. Shop is a first-class section, not an external link.
