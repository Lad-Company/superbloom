# UnoCSS for styling

Styling is authored with UnoCSS (on-demand atomic engine) wired into Astro via `@unocss/astro`. The R3 design's token contract (color, spacing, radii, type styles) is transcribed from Figma variables into CSS custom properties as the source of truth, and surfaced to authoring through the Uno theme. Per-section theming (invert + accent) is deferred until after the first homepage tracer bullet.

The R3 design resolves to a hybrid: roughly 10–15 reusable, token-driven section components (media card, 2-up, capes/capability list, marquee, FAQ, text-50, zine block, contact) composed into three art-directed page layouts (home, our-work, who-we-are), with shared nav/footer chrome and per-section color theming.

**Considered options**: vanilla CSS custom properties + Astro scoped styles, UnoCSS, Tailwind v4, CSS Modules.

**Why not vanilla CSS + Astro scoped styles**: This was the recommended option for a bespoke, animation-heavy editorial site with a modest component count and no large team needing utility guardrails — the prior R1 demo shipped this exact design that way. It was not chosen: the team preferred utility-class velocity and consistency across the reusable component set, accepting a build-time dependency in exchange.

**Why not Tailwind v4**: UnoCSS gives the same utility model with a lighter, on-demand engine (no separate purge step), faster builds, first-class Astro integration, and less framework lock-in (custom rules/presets; Tailwind-compatible via `presetWind` if needed).

**Tokens**: CSS custom properties remain the source of truth, mapped 1:1 from Figma R3 variables. Type styles: H1 (PP Neue Corp Tight Ultrabold 200/0.78), H3 (PP Neue Corp Tight Ultrabold 120/0.88), H6 (Graphik Medium 24/1.2), Eyebrow (PP Neue Corp Compact Ultrabold 17, +0.34px, uppercase), Body (Graphik Medium 19/1.3), Label (TT Bluescreens ExtraBold 17, uppercase). Colors: `--bg`/`--fg` with 12/20/60% alpha ramps. Spacing scale 8/12/24/32/120/200 + 24px gutter. Radii 6px (controls) / 8px (inputs).

**Accepted costs**: dynamically-composed or CMS-driven class names must be safelisted to survive on-demand generation; maintainers (and AI agents) must read the utility dialect.

**Reversibility**: medium. The token layer (CSS custom properties) is portable, but utilities live in markup, so switching engines later means rewriting class attributes across components.
