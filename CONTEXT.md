# Superbloom

Superbloom is a production company that blends an internal creative team with a curated external Creative Collective to produce branded entertainment, social content, and experiential campaigns for brand clients.

## Language

### People and Roles

**Team Member**:
A member of Superbloom's internal staff. Shown on the People page.
_Avoid_: Employee, creator (when referring to internal staff), talent

**Creator**:
A member of the Creative Collective — an external collaborator curated and championed by Superbloom. Shown on the Creators page.
_Avoid_: Team member, freelancer, talent, contributor

**Creative Collective**:
Superbloom's curated network of external Creators. The Collective is a core differentiator in Superbloom's business model — it is not a department or an internal team.
_Avoid_: Agency network, freelancer pool, contractor list

### Offerings

**Capability**:
One of Superbloom's named service offerings. Current capabilities: Creative, Branded Entertainment, Social Studios, All-Media Productions, Brand Salon.
_Avoid_: Service, offering, practice area

**Discipline**:
A granular area of expertise shown on the Who We Are page (e.g. strategy, creative, experiential, social, production, entertainment, media, creators). Describes the breadth of what Superbloom does. Modeled as a bespoke list on the `whoWeAre` singleton and not referenced elsewhere.
_Avoid_: Capability (when referring to this breadth list — a Discipline is not a productized service offering)

**Brand Salon**:
A specific Capability — a structured live workshop in which Superbloom brings the Creative Collective and a client team together to solve a brief in real time (typically 4 hours). Always treated as a Capability entry, not a standalone content type.
_Avoid_: Workshop, Brand Workshop, Salon

### Content

**Work**:
The portfolio section of the site. Work is composed of Case Studies.
_Avoid_: Projects, Portfolio, Campaign archive

**Case Study**:
A documented work engagement. A Case Study belongs to one or more Capabilities and may reference Creators who contributed. Its narrative anatomy is the Case Study Spine. It may be followed by optional Press and a Next Project.
_Avoid_: Project, campaign, post (when referring to Work content)

**Case Study Spine**:
The five required narrative sections of every Case Study: Highlights, Challenge, Unexpected Insight, Big Idea, and Results. The names, visible eyebrows, navigation labels, and order stay in lockstep.
_Avoid_: Body Blocks, page sections, flexible content

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
A standalone long-form, non-Zine editorial record. Editorial Articles appear alongside News on the Index Page and use the shared Article Detail presentation. They remain a separate authored content type even though News may also contain a long-form body.
_Avoid_: Zine Article, News, generic Article

**Index Page**:
The News & Press browse page. It contains News and Editorial Articles in one reverse-chronological feed by publication date. It excludes Zine Articles and Case Studies.
_Avoid_: All Work, Work index, Blog

**Article Detail**:
A reusable long-form presentation module shared by Zine Articles, News items, and Editorial Articles. It does not merge their distinct content models, routes, or editorial purpose.
_Avoid_: Generic Article model, Zine Issue, News Item

**Tag**:
A free editorial label applied to content (e.g. a News item, Case Study, Zine Article) for categorization, shown as a pill on cards. Authored as a small reusable taxonomy. Distinct from a Capability (a named service offering) and from Deliverables — a Tag is an editorial classification, not an offering.
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
A role enum (`light`, `dark`, `primary`, `secondary`) carried on each body block. Resolved to `--bg`/`--fg` CSS custom properties by the `Section` wrapper component. `primary`/`secondary` resolve to the case study's brand colors; foreground is auto-derived by WCAG relative luminance (threshold 0.5).
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

**Media Frame**:
The reusable visual container for image or video media. It establishes sizing, crop, media overlays, loading priority, and visibility-aware playback without knowing the content type or destination of its parent. Hidden video is always paused, including inactive media, offscreen media, and media in a background browser tab.
_Avoid_: Card media, thumbnail component, image card

**Editorial Card**:
A compositional card pattern that combines a Media Frame with content-specific metadata and linking. Work, News, Editorial Article, Zine Article, and Next Project cards are content adapters of this pattern, not a single universal content model.
_Avoid_: Universal card, News Card (when the content type is not News)

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

**Body Block**:
A typed content block within the flexible body of a News item, Editorial Article, or Zine Article. Body Blocks do not define the Case Study Spine, which is a fixed named composition.
_Avoid_: Case Study section, Case Study Spine

## Example dialogue

> **Dev:** The new filterable page — is that for Team Members or Creators?
> **Domain expert:** Creators. The Creative Collective. They're external — not on our team.
> **Dev:** Got it. And the People page?
> **Domain expert:** That's Team Members — the internal Superbloom staff.
> **Dev:** Is Brand Salon its own nav section or under Capabilities?
> **Domain expert:** Under Capabilities. It's one of our Capabilities. We might document more over time but the type is the same.
> **Dev:** Does the Index Page include Zine Articles?
> **Domain expert:** No. Index is News and Editorial Articles only. Zine Articles stay in the Zine section.
> **Dev:** Where do we link to the Shop?
> **Domain expert:** It's in the main nav. Shop is a first-class section, not an external link.
