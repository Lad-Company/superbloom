# Adopt Lenis smooth scroll

## Status

Accepted, supersedes the no-Lenis clause in ADR 0007.

## Decision

Adopt Lenis globally, synchronized with `gsap.ticker` and `ScrollTrigger.update`. Lenis is disabled for reduced-motion users and when JavaScript is unavailable, preserving native scrolling in both cases.

## Context

Native scroll events made scrubbed pins, depth layers, horizontal rails, and marquee travel visibly uneven. Momentum scrolling is required to provide a consistent scroll signal for these interactions.

ADR 0007 explicitly identified this as a reversible decision. The design now requires the depth and pin smoothness that Lenis enables.

## Mitigations

- Set `history.scrollRestoration` to `manual` while Lenis is active so the browser does not fight route entry behavior.
- Intercept same-page anchors and use `lenis.scrollTo`; independently scrollable overlays opt out with `data-lenis-prevent`.
- Do not initialize Lenis under `prefers-reduced-motion`; all scroll-driven effects use `gsap.matchMedia()` gates.
- Use the restrained `lerp: 0.1` default. Momentum supports depth and scrub continuity rather than acting as a decorative effect.

## Consequences

Scroll-driven motion uses the shared smooth-scroll module. Native scrolling remains the accessible fallback for no-JS and reduced-motion contexts.
