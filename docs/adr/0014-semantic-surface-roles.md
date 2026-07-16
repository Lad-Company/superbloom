# Semantic surface roles over hue-named CMS themes

Superbloom components express color through semantic Surface Roles, never raw brand hues. A component may request a role such as `brand-accent`, `brand-muted`, `case-primary`, `case-secondary`, `light`, or `dark`; the page template resolves that role to the appropriate fixed Superbloom token or Case Study Brand Color.

This supersedes ADR-0013's hue-named CMS theme values (`blue`, `green`, `pink`, `purple`). Stored hue values will be migrated to the semantic roles allowed by each page template. CMS authors may choose only from the constrained semantic roles that a template exposes. Templates own page palettes and all role-to-token mappings.

**Why semantic roles**: a hue says how a surface looks today, not why it exists. The same components recur on pages with different color sequences, and Case Studies add client-owned Primary and Secondary Brand Colors. Semantic roles preserve one component API across both systems and make palette changes intentional rather than a scattered prop rewrite.

**Why not retain hue props behind components**: this preserves the current ambiguity at every call site and makes client color surfaces an exception to the design system. A compatibility layer would delay, rather than remove, the mismatch between content intent and implementation.

**Why constrained authoring**: editors need art-direction control, but unrestricted roles allow invalid pairings and dissolve page-level color rhythm. A page template can expose only the roles appropriate to its composition.

**Contrast policy**: semantic surface resolution must report when the best available black or white foreground misses WCAG AA contrast for body text. This is an advisory, not a publishing gate; editors may use an explicit approved foreground override when art direction requires it.

**Migration**: map every existing `blue`, `green`, `pink`, and `purple` theme value to a page-template-approved semantic role. Preserve `light`, `dark`, `primary`, and `secondary` where their existing semantic meaning remains valid. Update schemas, queries, scoped variable resolution, and authored documents together.

**Reversibility**: medium. The runtime mapping is localized, but stored CMS values require a content migration. The change is warranted because hue values are an unstable abstraction boundary for reusable components.
