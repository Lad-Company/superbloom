# Figma-first evidence and motion reset

> **Amended and partially superseded by ADR-0020.**
>
> **Replaced decision:** The broad statement that the supplied July 2026 screens are the primary authority does not govern CMS content composition. For Content Card, Content Layout Row, Index, Our Work, unified Article, and Zine composition decisions, the approved CMS Content Composition specification is authoritative and cites the signed-off Figma nodes `1:4790` and `1:4816`.
>
> **Preserved decisions:** Current code remains implementation inventory rather than design authority. Gaps in approved evidence require an explicit decision or prototype. The motion reset and its approval responsibilities remain unchanged.
>
> The text below records the original decision context. Apply it only where ADR-0020 and the approved composition specification do not establish a newer rule.

## Historical record

The supplied July 2026 Figma screens are the primary visual and art-direction evidence for Superbloom House. Stable ADR and `CONTEXT.md` decisions follow as the source for content-domain meaning and explicit technical constraints. Current code is an implementation inventory, not a visual source of truth.

When Figma does not establish a rule, the team must prototype it or make a new decision. It must not infer the rule from prior implementation alone.

All existing motion behavior, GSAP/ScrollTrigger usage, timing, and easing are void as design-system precedent. A fresh motion prototype session will establish the interaction primitives, timing, easing, responsive behavior, and reduced-motion behavior before motion is standardized or extended. Arietta approves the visual direction of the selected prototype; Pete validates technical feasibility and accessibility. Static content sequence and reduced-motion safety remain requirements in the interim.

**Why not treat code and Figma equally**: current code contains known tracer decisions, incomplete responsive behavior, and interactions established before this design-language review. Giving it equal authority would preserve accidental implementation details.

**Why reset rather than refine existing motion**: the existing motion was established too quickly and has no approved behavioral or timing contract. Refining it would anchor the new system to unvalidated choices.

**Reversibility**: low risk. This changes the decision process and defers unapproved behavior; it does not remove a necessary domain capability.
