# Compositional design-system boundaries

> **Partially superseded:** ADR-0017 defines the fixed Case Study Spine, replaces Outcomes with Results and Related Work with Next Project, and removes generic narrative Body Blocks from the Case Study composition.

Superbloom’s design system is composed from small primitives and named modules:

- `SurfaceSection` owns Surface Role, foreground contract, and vertical rhythm.
- `PageGrid` owns 12-column layout, responsive spans, page inset, and gutter.
- `MediaFrame` owns media ratio, crop, overlays, and controls.
- `EditorialCard` composes a Media Frame with metadata and linking; Work, News, Zine, and Related Work use content adapters.
- Navigation, ContactBand, and Footer form the shared site shell.
- Media Hero, Page Hero, and Case Hero remain separate named modules.

No configurable mega-section or universal Card is permitted. Components compose through slots and focused props rather than accumulating unrelated optional content fields.

`FactCardGrid` and Case Study `Outcomes` are separate modules that may share the low-level `Metric` primitive. Article Detail is a reusable long-form presentation module across distinct News and Zine content models. NarrativeSectionNav is limited to templates with named, anchorable narrative blocks.

Fixed Composition templates own module order and allowed variants. Editorial Composition templates let CMS authors arrange only an allowlisted module sequence. Neither composition mode is generalized into the other.

This supersedes the shared-component portion of ADR-0012: the former `Card.astro` contract is replaced by `MediaFrame`, `EditorialCard`, and content adapters. ADR-0012's Case Study card media, ordering, and tag-taxonomy decisions remain valid.

**Why not a universal Card or mega-section**: each would unify superficial visual similarity while combining incompatible content responsibilities. That makes future variants require more flags, weaker types, and harder CMS constraints.

**Why not one CMS composition model**: art-directed narrative templates and modular landing pages have different editorial permissions. Modeling both as arbitrary sections either prevents needed editorial ordering or exposes layout freedom where it is not intended.

**Reversibility**: medium. The architecture is local to page and component composition, but splitting the current Card and extending Case Study media layouts touches several templates and CMS schemas. The boundary is worth establishing before more pages duplicate the current contracts.
