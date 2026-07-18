# Case Study Spine as a fixed named composition

Case Studies use five required sections whose meaning, visible eyebrow, navigation label, and order match the signed-off July 2026 Figma: Highlights, Challenge, Unexpected Insight, Big Idea, and Results. Sanity models these as named fields rather than a page-wide Body Block array; each section has purpose-specific fields and an ordered list of the standardized media layouts. This keeps the Case Study Spine fixed while retaining art direction within each section.

One `CaseStudyComposition` module owns Case Hero, Brand Color resolution, the Case Study Spine, Press, Next Project, and navigation state behind one seam. The route owns data fetching and not-found handling, while the Shared Site Shell remains outside. News keeps its separate flexible Body Blocks and no longer shares top-level rendering with Case Studies.

Press is optional and references up to three News items. Next Project is one optional, explicitly curated Case Study. Primary Brand Color is required; Secondary Brand Color is required only when a section selects the `case-secondary` Surface Role. Each named section exposes only its allowed Surface Roles.

**Migration**: make a direct cutover because the site is not live. Copy Tyson's former Solution content into both Unexpected Insight and Big Idea, migrate its other content by meaning, and remove the obsolete Mystery Voyage Case Study record. Schema contract tests protect required Spine content, section media, color requirements, Press cardinality, and Next Project cardinality; rendered composition is not an automated test surface.

**Supersedes**: ADR-0011's shared Case Study/News Body Block rendering and its former Case Study spine names; ADR-0016's references to Case Study Outcomes, Related Work, and generic narrative Body Blocks.

**Why not retain page-wide Body Blocks**: they let editors rearrange or omit the narrative meaning that the signed-off design fixes. Named sections create locality for Case Study rules and give the composition module leverage without turning News into the same content model.

**Reversibility**: medium. The module change is local, but reversing the named fields requires another Sanity content migration.
