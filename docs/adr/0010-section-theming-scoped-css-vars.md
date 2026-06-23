# Section theming via scoped CSS variables

Colored and inverted sections are themed by scoping the `--bg`/`--fg` token contract per section, rather than swapping Uno color utilities. A section wrapper sets `--bg` and `--fg` for its subtree; components author against `var(--bg)`/`var(--fg)` and stay theme-agnostic. This generalizes the pattern already present in `Hero.astro` and `Capes.astro`.

A themeable section carries a `theme` role: `light` (default white/black), `dark` (inverted black/white, e.g. footer chrome), `primary`, or `secondary`. `primary`/`secondary` resolve to a client brand's two accent colors, chosen per Case Study via two CMS color pickers and scoped on the page as `--brand-primary`/`--brand-secondary`. For Tyson, primary = yellow (hero), secondary = red (Outcomes).

**Foreground on colored sections**: auto-derived from the background color's relative luminance (light backgrounds get black text, dark backgrounds get white). No second text-color field in the CMS for now. This is correct for clearly light/dark accents (yellow→black, red→white) but can misfire on mid-tone brand colors; a manual override field is the escape hatch if that arises.

**Why scoped CSS vars over Uno color utilities**: the token contract (ADR-0009) already makes `--bg`/`--fg` the source of truth, and existing components already read them. Scoping the same two variables per section means a component is written once and themes for free, with no per-theme class permutations and no safelisting of dynamically-composed Uno color classes. Brand colors are arbitrary per-client values that cannot be enumerated as Uno theme entries ahead of time.

**Why per-case brand pickers over a fixed curated palette**: the colors are the *client's* identity colors, not Superbloom's. A fixed palette would force every brand into Superbloom's swatches; per-case pickers let each Case Study carry its brand's accents. Sections reference the colors by role (`primary`/`secondary`), so the mapping stays stable even as the picked colors change.

**Considered options**: Uno color utility classes per section, single per-case accent + invert boolean, free-form per-section color picker, scoped CSS variables with primary/secondary roles.

**Why not a single accent + invert**: the design uses two distinct hand-picked colors on one page (yellow hero, red Outcomes), so one accent plus a boolean cannot express it.

**Why not free-form per-section color**: it removes the brand-identity framing and lets editors pick off-brand colors section by section; roles tied to two per-case pickers keep the page coherent.

**Reversibility**: medium. The role enum and scoped-variable mechanism are localized to the section wrapper and schema, but `theme` values live on stored content, so changing the role vocabulary later means a content migration.

## Amendment — fixed Superbloom brand colors as named roles

The Home-Zine block (see `docs/design-system/home-zine.md`) is themed on a **fixed Superbloom brand color** (a green, `#99a224`) that is neither light/dark nor a per-case-study brand accent. The original `primary`/`secondary` roles are deliberately client-owned and arbitrary, so this Superbloom-owned color does not belong in that pair.

**Decision**: extend the `theme` role enum with **named Superbloom brand roles** (starting with `zine`) rather than a one-off inline background. Each named role resolves to a fixed token (e.g. `--brand-zine`) and feeds the same `--bg`/`--fg` contract, with foreground still auto-derived by relative luminance. This keeps the section authored as a role (consistent with every other block) and keeps the color a first-class, reusable token.

**Why not a one-off background**: an inline color reintroduces the free-form per-section coloring this ADR rejected, and hides a recurring brand color from the token set. A named role keeps it enumerable and themeable.

**Distinction**: `primary`/`secondary` = the *client's* brand accents, picked per Case Study; `zine` (and any future named role) = *Superbloom's* own fixed brand colors. Both flow through the same scoped-variable mechanism.

**Reversibility**: same as above (medium) — adding a role value is additive, but the value lives on stored content.
