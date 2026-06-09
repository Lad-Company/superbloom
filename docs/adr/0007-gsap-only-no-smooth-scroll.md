# GSAP + ScrollTrigger only — no smooth scroll, no Motion

The animation stack is GSAP with the ScrollTrigger plugin. No Lenis. No Motion / Framer Motion. A `prefers-reduced-motion` policy is mandatory: at app startup, `gsap.matchMedia()` registers a `(prefers-reduced-motion: reduce)` query that disables ScrollTriggers and sets timeline durations to 0.

GSAP's full plugin set has been free for commercial use since the 2024 Webflow acquisition, removing the historical licensing objection. ScrollTrigger covers the scroll-driven work a portfolio site needs (pinning, parallax, reveal sequences, scroll-linked timelines) without overriding native scroll.

**Considered options**: GSAP + ScrollTrigger only, GSAP + Lenis, Motion only, GSAP + Motion.

**Why not Lenis**: Lenis overrides native scroll. That breaks browser scroll restoration on back navigation, requires custom anchor-link handlers, complicates `prefers-reduced-motion`, and invites accessibility audit findings about scroll hijacking. The smooth-scroll aesthetic also reads as dated by 2026. If a specific design later requires momentum scroll, Lenis is additive and can be added without rewriting GSAP code — this is not a one-way door.

**Why not Motion**: Motion is strongest for declarative React component animations (modals, drawers, stateful transitions). Superbloom's site is dominated by scroll-driven work, where GSAP is the better fit. Adopting Motion in addition would force two animation paradigms on whoever maintains the site.

**Required companion**: every animation must opt in to the reduced-motion policy. Convention: timelines are created inside `gsap.matchMedia()` blocks rather than at module top level.
