# Editorial refactor implementation plan

**Status:** Superseded historical record

**Superseded by:** [CMS Content Composition implementation specification](./cms-content-composition-spec.md)

## Historical purpose

This plan organized an earlier editorial refactor around semantic surfaces, shared primitives, content-specific card adapters, legacy narrative blocks, and compatibility-first deployment sequencing.

The plan predates the approved unified Article, Content Card, and Content Layout Row contracts. Its implementation sequence and schema migration guidance are retired and must not be used as an actionable checklist.

## Preserved context

The following architectural principles remain useful when they do not conflict with the current specification:

- keep `MediaFrame` focused on media rendering rather than routing or card placement
- keep content-specific adapters responsible for translating content and constructing routes
- resolve Surface Roles in page compositions rather than hardcoding colors in reusable modules
- preserve keyboard access, no-JavaScript baselines, reduced-motion safety, and responsive verification
- avoid unsupported universal page builders and hypothetical configuration seams

The current specification governs Article unification, Content Card composition, Content Layout Rows, Index and Work structures, migrations, sequencing, and acceptance criteria. Do not infer implementation completion from this historical record.
