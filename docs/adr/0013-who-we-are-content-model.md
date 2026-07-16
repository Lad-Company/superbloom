# Who We Are content model, Discipline concept, and hue brand-color roles

> **Partially superseded:** ADR-0014 replaces section 3's hue-named,
> editor-selectable theme roles with template-constrained semantic Surface Roles.
> Sections 1 and 2 remain valid.

This ADR records three interrelated decisions made when building the `/who-we-are` page tracer.

## 1. `whoWeAre` singleton with structured named fields

The Who We Are page is one of three fixed art-directed layouts (ADR-0009). Its section order is fixed by design; editors can only change content, not layout. A `whoWeAre` Sanity singleton uses one named field per section (`heroHeading`, `featuredMedia`, `marquee`, `introStatement`, `statCards[]`, `advantageHeadline`, `advantageBlocks[]`, `disciplines[]`, `ctas[]`, `faqs[]`).

**Why not a `sections[]` block array** (like `homepage`): the homepage's polymorphic sections[] is warranted because the page has genuinely reorderable modular sections. The Who We Are layout is fixed art-direction — the sections are always in the same order and the Figma annotation says "Module flexible to update content", not "Module flexible to move/remove." Named fields are simpler to author, produce a cleaner GROQ projection, and make missing-content defaults straightforward.

**Reversibility**: medium. Named fields on a singleton are easy to add/remove (non-breaking), but migrating stored content to a different shape (e.g. toward a block array) would require a content migration. Not a one-way door for code; potentially one-way for content.

## 2. `Discipline` — distinct from `Capability`

The Who We Are page has an 8-item list (strategy, creative, experiential, social, production, entertainment, media, creators) with short descriptions. This is a different concept from the 5 named `Capability` service offerings (Creative, Branded Entertainment, Social Studios, All-Media Productions, Brand Salon) defined in `CONTEXT.md` and used for homepage Capes and Case Study tagging.

**Decision**: model as a bespoke `disciplines[]` field on the singleton, not as references to `capability` documents. The `Capability` type remains a fixed set of 5 named productized offerings. `CONTEXT.md` adds a `Discipline` definition to keep the boundary clear.

**Why not expand `Capability` to 8**: the overlap between the two sets is loose (only "Creative" and loosely "Social" align), and the existing Capability type is used across Case Studies and the homepage Capes block — expanding it would pollute that taxonomy and require re-tagging stored content.

## 3. Hue-named brand color roles (`blue`, `green`, `pink`, `purple`)

Four Superbloom-owned decorative brand colors appear in the Who We Are design: blue `#3993dd`, green `#99a224`, pink `#e6c6e2`, purple `#3f2293`. These are used on full-width band sections (featured media = blue, marquee = green) and per-stat-card theming. They flow through the same scoped-variable `--bg`/`--fg` mechanism as `light`/`dark` (ADR-0010).

**Decision**: add them as hue-named roles (`blue`/`green`/`pink`/`purple`), resolving to explicit `--bg`/`--fg` pairs hardcoded per role. Add the four tokens (`--blue`, `--green`, `--pink`, `--purple` + `*-fg` pairs) to `styles/tokens.css`.

**Amendment to ADR-0010**: ADR-0010's amendment established the pattern of "named Superbloom brand roles" and suggested `zine` as the first (for green `#99a224`). This decision diverges: hue names are used instead of semantic surface names. Reason: this page uses four decorative brand colors that appear on unrelated surfaces (stats cards, marquee, featured media, contact block). Tying a color to a single semantic surface (e.g. `zine`) would be misleading when the same green appears on the marquee of an About page. Hue names make the palette explicit and enumerable without implying a surface constraint. The `green` role realizes the `#99a224` previously proposed as `zine`.

**Foreground**: hardcoded per role (blue→white, green→black, pink→black, purple→white), matching R3. The luminance auto-derivation from ADR-0010 applies to the unbounded `primary`/`secondary` client brand colors, where the hex value is arbitrary. Named brand hues are known values and explicit fg avoids edge cases.

**Editor experience**: the `theme` field on stat cards and band sections exposes all six non-brand roles (`light`, `dark`, `blue`, `green`, `pink`, `purple`) as a radio list. `primary`/`secondary` (per-case brand colors) are omitted from Who We Are singleton fields since this is not a Case Study page.

**Reversibility**: low risk for the token additions (additive). Medium for stored `theme` values — renaming a role later requires a content migration. The hue names are stable identifiers.
