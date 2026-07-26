# Library R1 Page Feedback — Specification

**Status:** Approved for issue decomposition (reviewed 2026-07-26). In-scope groups A–G are ready for `to-issues`. Column Packing (A6), Who We Are hover pairs (E2), and the feature track are excluded and tracked as their own specs.
**Method:** Produced by `feedback-sweep` from a multi-page review pass. Implementation-neutral.
**Source Figma (Superbloom Library):** https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library

## Scope status (read before decomposition)

**RESOLVED — ready for `to-issues` now.** All open questions for these are answered with observable acceptance criteria:

- **A. Shared standards:** A1 (button hover, color-aware), A2 (radius `Radius/S` 6px), A3 (standard badges), A4 (card line-clamping), A5 (spacing scale), A7 (hero media playback), A8 (global 4-line cap)
- **B. Shared motion:** B1 (single page-entry), B2 (crisp parallax), B3 (nav color awareness)
- **C. Index:** C1, C3, C4, C5, C6
- **D. Home:** D1, D2, D3, D4, D6
- **E. Who We Are:** E1, E3, E4, E5
- **F. Shop/item:** F1, F2
- **G. Mobile QA:** G1–G7

**BLOCKED — in this spec, but do not decompose until a separate spec lands:**

- **C2** (Index Featured) and **D5** (Home Our Work) — both block on the Column Packing primitive (A6).

**EXCLUDED — tracked as their own specs, NOT to be decomposed from this document:**

- **A6 Column Packing** — own `/grill-with-docs` → `/to-spec` session.
- **E2 Who We Are hover pairs** — own `/grill-with-docs` → `/to-spec` session.
- **Feature track:** Google Analytics (folds into MVP Completion observability), media crop/focal point, Sentry→Discord — each its own spec.

## Context

A single review pass produced feedback across the Index, Home, Who We Are, and Shop pages, plus sitewide component/motion notes, a mobile QA pass, and three net-new feature requests. Much of the per-page feedback is the same system-level decision recurring on multiple surfaces (column packing, Contained Control hover, border-radius rule, Content Card line-clamping, page-entry motion). This spec normalizes the feedback into domain vocabulary from `CONTEXT.md`, deduplicates cross-cutting items, and groups by theme so the shared decisions are made once.

## Goal

Bring the Index, Home, Who We Are, and Shop pages to review parity with the current Figma, and standardize the shared components and motion behaviors the feedback repeatedly cites, so that per-page polish resolves to a small number of shared primitives.

## Non-goals

- Building the three net-new features (Google Analytics, media crop/focal point, Sentry→Discord). These are peeled into their own grill → spec track (see Deferred items) and are out of scope for this feedback spec.
- Re-opening approved content models (News, Case Study Spine, Editorial Article) beyond the presentation changes listed here.
- Authoring final CMS copy or media.

## Source feedback summary

Grouped by originating surface, preserved for traceability:

- **Index Page** (`node-id=6475-8338`): editable wrapping header; column-packed Featured layout (reusable); large header-sized sort control (date asc/desc); per-item shows title + date only (`06 26 26`), no Read More; Load More at bottom.
- **Home Page** (`node-id=6475-8225`): News section removes arrow buttons, cards show Tags top-left; restore "Built for Brands with Bigger Ambitions" section; Parallax section images CMS-editable; Capabilities has one caption pinned top, flip-scroll top item aligned to caption, infinite-loop feel; Our Work needs flexible grid with column packing; hero small caption uses correct font token.
- **Who We Are** (`node-id=6475-8096`): hero max three lines, playback controls bottom-right, marquee too fast; section below hero needs three parallax items with gray→brand-white hover that surfaces a CMS-defined image; stats section is a stat with text below; clients list Founded/Team cards use body copy matching client-list size; Unfair Advantage OK; listicle needs scroll animation.
- **General (components + motion):** page-entry motion fires twice (load + route change); parallax background must not blur (crisp with depth); button/hover discrepancies and color awareness; nav color awareness inconsistent; shop logo not inverted; badges should use standard badge/tag component (shop + item pages); centralize spacing (esp. header space); standardize tag border radii; remove non-standard Index components; Content Card title/caption both clamp to two lines; media cards no border radius (only tags + buttons get radius).
- **Feature additions:** Google Analytics; media crop + focal point; Sentry error logging → Discord + anomaly alerts.
- **Mobile QA:** nav full-screen takeover using page-load swipe-down; Capabilities text too large/wide (horizontal scroll), header slightly smaller on mobile; Who We Are hero too tall/wide, global four-line cap on mobile; "Bring Us the Brief" / "Join the Creative Collective" boxes full-width with buttons directly below title; Work page header good at four lines but too wide; Case Study results numbers too small.

---

## Requirements

Groups are ordered so shared foundations (A–B) precede the page work that depends on them.

### A. Shared standards (foundational — most page items depend on these)

**A1. Standardize the Contained Control hover treatment and make it color-aware**
- Rationale: multiple inconsistent buttons cited. "Explore the Creative Collective" is the correct reference (Surface Wipe). "View All News and Press" is missing its white inset border on hover. The zine-section button sits on green and must not draw the inset border. The news-carousel "Next" button is a bad control to be removed.
- Acceptance criteria:
  - One Contained Control hover style is applied sitewide, matching the "Explore the Creative Collective" reference.
  - Hover treatment is color-aware: on light/neutral surfaces it draws the white inset border; on the green (and other colored) surfaces it does not draw the inset border.
  - "View All News and Press" shows the white inset border on hover.
  - The news-carousel "Next" button is removed.
- Dependencies: `Contained Control` / `Surface Wipe` (CONTEXT.md), `Surface Role` color resolution (ADR 0014), `design-language.md`.

**A2. Standardize border radius: tags and buttons only**
- Rationale: some tags have radius (correct), some do not (incorrect); media cards have inconsistent radius.
- Acceptance criteria:
  - Tags and buttons (Contained Controls) use the standard radius token `Radius/S` = 6px (Figma variable).
  - Media (Media Frame / media cards) have no border radius; edges are sharp.
  - No component outside tags/buttons carries a border radius.
- Dependencies: `tag.md`, `Media Frame` (CONTEXT.md).

**A3. Standardize badges/tags on the standard component**
- Rationale: shop "Sold Out" badge and item-display-page badges are bespoke.
- Acceptance criteria:
  - The "Sold Out" badge and other shop/item-page badges render via the standard badge/Tag component (typography, radius, placement).
- Dependencies: `tag.md`, A2.

**A4. Content Card line-clamping for aligned info blocks**
- Rationale: cards with title/caption/date don't line up.
- Acceptance criteria:
  - For every Content Card carrying title + caption + date, caption clamps to two lines max and title clamps to two lines max.
  - Adjacent cards' info blocks align vertically as a result.
- Dependencies: `Content Card` Info block (CONTEXT.md, ADR 0012/0020), `news-card.md`.

**A5. Centralize spacing tokens, especially header space**
- Rationale: spacing (particularly space afforded to headers) is not standardized.
- Acceptance criteria:
  - Spacing adopts the existing Figma spacer scale: `spacer-3xs` 12, `spacer-2xs` 24, `spacer-xs` 32, `spacer-s` 40, `spacer-m` 64, `spacer-l` 80, `spacer-xl` 96, `spacer-2xl` 120, `spacer-3xl` 160, `spacer-4xl` 200; plus `page-gutter` 24 and `page-margin-2` 32.
  - Header vertical space is driven by a token from this scale rather than per-page values (specific token to be pinned from Figma per header context during decomposition).
- Dependencies: `design-language.md`, Figma spacer variables.

**A7. Hero media playback controls (shared)**
- Rationale: longer hero media needs visitor play/pause controls per Figma. This is a sitewide behavior, not a single page's feature; the Who We Are hero video is the core example.
- Acceptance criteria:
  - Longer hero media exposes play/pause controls, positioned bottom-right per Figma.
  - Controls are keyboard-reachable and available regardless of autoplay state.
  - Behavior integrates with Media Frame visibility-aware playback (hidden/offscreen/background-tab media stays paused).
  - The Who We Are hero video is the reference implementation.
- Dependencies: `Media Frame`, `Reduced-Motion Feedback` (CONTEXT.md), `who-we-are.md`.

**A8. Global header line cap (four lines)**
- Rationale: header line counts vary; a single global cap is wanted.
- Acceptance criteria:
  - Headers are capped at four lines globally (all breakpoints).
  - The Who We Are hero at Figma `node-id=6475-8391` is the longest acceptable example.
- Dependencies: `design-language.md`, A8 consumers: E1, G2, G4, G6.

**A6. Column Packing layout primitive** *(deferred to its own grill session — see R1)*
- Rationale: Index Featured and Home Our Work both need a column that packs multiple rows; requested as a reusable "column packed" layout.
- Status: **Not specified here.** Column Packing touches the approved Content Card and CMS Content Composition models (ADR 0012/0016/0020) and requires its own `/grill-with-docs` → `/to-spec` pass before decomposition. This spec depends on that output but does not define it.
- Consumers blocked on it: C2 (Index Featured), D5 (Home Our Work).
- Dependencies: Content Card model (ADR 0012, 0016, 0020), CMS Content Composition spec.

### B. Shared motion standards

**B1. Page-entry motion must fire once, not on every route change**
- Rationale: initial load does a fade-up; clicking to a new page swipes up again, so it reads as running twice.
- Acceptance criteria:
  - The page-entry reveal plays once per genuine load.
  - Route navigations do not replay the full page-entry reveal (they use the Route Transition, not a second fade-up).
- Dependencies: `Route Transition`, `Three-Phase Loading`, `Motion Language` (CONTEXT.md), ADR 0021, `motion-language-implementation-spec.md`.

**B2. Parallax has depth without blur**
- Rationale: the element behind a parallax should not be blurred.
- Acceptance criteria:
  - Parallax backgrounds render crisp (no blur) while retaining parallax depth.
  - Reduced-Motion behavior unchanged (parallax removed under reduced motion per existing rule).
- Dependencies: `Reduced-Motion Feedback` (CONTEXT.md), motion specs.

**B3. Navigation bar color awareness is consistent**
- Rationale: nav color awareness is inconsistent and doesn't reuse one behavior.
- Acceptance criteria:
  - The nav resolves foreground/background from a single shared color-awareness behavior across all surfaces it overlays.
- Dependencies: `Surface Role` (ADR 0014), `Shared Site Shell` (CONTEXT.md).

### C. Index Page

**C1. Editable header that wraps to two lines**
- Acceptance criteria: header is CMS-editable and wraps to two lines, behaving like the Work Hero.
- Dependencies: Work Hero as reference analog.

**C2. Featured section uses Column Packing**
- Acceptance criteria: the Featured section renders with the A6 Column Packing primitive per Figma.
- Dependencies: A6.

**C3. Large header-sized sort control (date asc/desc)**
- Acceptance criteria: a header-sized sort control lets a visitor sort by Publication Date ascending or descending.
- Dependencies: `Publication Date` (CONTEXT.md), `index-page.md`.

**C4. Per-item display: title + date only, formatted `06 26 26`**
- Acceptance criteria: each Index item shows only title and a date formatted `MM DD YY` space-separated (e.g. `06 26 26` for 2026-06-26); no "Read More" control.

**C5. Load More at the bottom**
- Acceptance criteria: a Load More control appears at the bottom of the Index list and pages in additional Articles.

**C6. Remove non-standard Index components**
- Acceptance criteria: bespoke Index tags/components are replaced by the standard Tag component; Index button hover states match A1.
- Dependencies: A1, A2, A3.

### D. Home Page

**D1. News section: remove arrows; cards show Tags top-left**
- Acceptance criteria: arrow buttons removed from the News section; News cards display their Tags at the top-left of the Media Frame.
- Dependencies: `Tag` placement (CONTEXT.md, `tag.md`), `news-carousel.md`, A1 (Next button removal, A1).

**D2. Restore "Built for Brands with Bigger Ambitions" section**
- Acceptance criteria:
  - First check for stale/unused prior implementation code; if it exists, restore from it.
  - If no usable prior code exists, rebuild from Figma `node-id=6475-8249` (frame `2147264193`) to visual + content parity.
- Dependencies: Figma `node-id=6475-8249`.

**D3. Parallax section images CMS-editable**
- Acceptance criteria: the parallax section images are settable from the CMS.
- Dependencies: B2, Media Asset model.

**D4. Capabilities: single pinned caption, top-aligned non-overflowing scroll**
- Acceptance criteria:
  - Only one caption on the left, pinned to the top of the scroll section (currently two).
  - The top of the capability list stays pinned vertically even with the left caption; the list does not scroll upward past that line.
  - Items scrolled past must disappear or reappear elsewhere; no item scrolls up into or above the top bounding edge of the scroll box (the top edge should never show an item entering from above).
  - Infinite-loop "comes back around" behavior is aspirational, not required, and is not required under Reduced-Motion.
- Dependencies: `Pinned Storytelling`, `Reduced-Motion Feedback` (CONTEXT.md), `capes.md`, `Capability`.

**D5. Our Work: flexible grid using Column Packing**
- Acceptance criteria: the Our Work section uses a more flexible grid supporting the A6 Column Packing primitive.
- Dependencies: A6, `work-index.md`.

**D6. Hero small caption uses correct font token**
- Acceptance criteria: the hero's small caption uses the `Label` token (PP Neue Corp Tight Ultrabold, 17px, letter-spacing 2, line-height 1) — the `Compact Interface Type` role — replacing the current incorrect font. Confirm the exact bound layer against Figma `node-id=6475-8225` at build time.
- Dependencies: typography tokens (`Compact Interface Type` / `design-language.md`), Figma.

### E. Who We Are Page

**E1. Hero: global line cap, playback controls, slower marquee**
- Acceptance criteria:
  - Hero text respects the global four-line cap (A8); `node-id=6475-8391` is the longest acceptable example.
  - Playback controls per the shared A7 standard (bottom-right).
  - The marquee scroll speed is reduced.
- Dependencies: A7, A8, `Marquee Display`, `Motion Tempo` (CONTEXT.md), `who-we-are.md`.

**E2. Section below hero: three parallax hover items with image reveal** *(deferred to its own grill session — see R2)*
- Rationale: a copy block plus hover item/image pairs where hover transitions text gray → brand white and surfaces a CMS-defined image. Example items: "Independent Creative Company," "Varied Disciplines," "Unignorable Work."
- Status: **Not specified here.** This adds a new authorable content model to the `whoWeAre` singleton (ADR 0013) and an accessibility-sensitive hover interaction; it requires its own `/grill-with-docs` → `/to-spec` pass before decomposition. Excluded from this spec's decomposition.
- Dependencies: `whoWeAre` singleton, ADR 0013, Media Asset, `Reduced-Motion Feedback`.

**E3. Stats section: a stat with text below it**
- Acceptance criteria: the stats section presents a stat with supporting text below it.
- Dependencies: `who-we-are.md`.

**E4. Clients list: Founded/Team cards use body copy at client-list size**
- Acceptance criteria: the Founded and Team cards use normal body copy at the same font size as the client list, replacing the current varied copy treatment.

**E5. Listicle: scroll-scrub animation**
- Acceptance criteria:
  - The listicle below the Unfair Advantage section animates via scroll-scrub: its progress is tied to scroll position, advancing as the visitor scrolls down and reversing on scroll up.
  - Uses linear scrub easing per `Motion Easing` and conforms to an approved Motion Recipe.
  - Under Reduced-Motion the scrubbing is removed (content shown without scrub).
- Dependencies: `Motion Language`, `Motion Easing`, `Reduced-Motion Feedback` (CONTEXT.md).

- Note: "Unfair Advantage" section confirmed acceptable, no change.

### F. Shop and item pages

**F1. Invert the shop logo**
- Acceptance criteria: the logo on the Shop page renders inverted (matching other surfaces).
- Dependencies: B3 / Surface Role logo treatment.

**F2. Standard typography and Contained Control hover on item pages**
- Acceptance criteria: individual item/product display pages apply the standard typographic styles and A1 hover states.
- Dependencies: A1, A3.

### G. Mobile QA

**G1. Nav is a full-screen takeover using the page-load swipe-down animation**
- Acceptance criteria: on mobile the nav opens as a full-screen takeover using the same swipe-down animation as page load.
- Dependencies: B1 (shared motion), B3.

**G2. Header line cap on mobile**
- Acceptance criteria: headers respect the global four-line cap (A8) on mobile.
- Dependencies: A8.

**G3. Capabilities sizing on mobile**
- Acceptance criteria: on mobile the Capabilities text no longer causes horizontal scroll; header text is slightly smaller than desktop.
- Dependencies: D4.

**G4. Who We Are hero sizing on mobile**
- Acceptance criteria: the Who We Are hero fits within the mobile viewport (not too tall/wide) and respects the four-line cap.
- Dependencies: E1, G2.

**G5. "Bring Us the Brief" / "Join the Creative Collective" mobile layout**
- Acceptance criteria: on mobile these boxes are full width and the "Get in Touch" / "Learn More" buttons sit directly below the title.

**G6. Work page header width on mobile**
- Acceptance criteria: the Work page header (already four lines) is narrowed so it is no longer too wide on mobile.
- Dependencies: G2.

**G7. Case Study Results numbers larger on mobile**
- Acceptance criteria: the Results-section numbers are enlarged on mobile.
- Dependencies: `Results` (CONTEXT.md), `case-study-spine-implementation-spec.md`.

---

## Open questions

Resolved during review (folded into requirements above):
- **OQ-1 (A5):** RESOLVED — adopt the existing Figma spacer scale (see A5).
- **OQ-2 (A6):** RESOLVED — Column Packing is handled in its own `/grill-with-docs` → `/to-spec` session (see R1).
- **OQ-3 (D2):** RESOLVED — check for stale/unused code first, else rebuild from Figma `node-id=6475-8249` (frame `2147264193`) to visual + content parity (see D2).
- **OQ-4 (D4):** RESOLVED — infinite loop is aspirational, not required, and not required under Reduced-Motion; real requirement is top-pinned, non-overflowing scroll (see D4).
- **OQ-5 (E1/G2):** RESOLVED — global four-line cap across breakpoints (A8); `node-id=6475-8391` is the longest acceptable example.
- **OQ-8 (D6):** RESOLVED — `Label` token (confirm bound layer at build time; see D6).

Resolved during review (continued):
- **OQ-7 (E5):** RESOLVED — scroll-scrub (see E5).

Deferred to their own grill sessions (not open questions, tracked as separate specs):
- **OQ-6 (E2):** The Who We Are hover items get their own `/grill-with-docs` → `/to-spec` pass (see R2): exact CMS shape for copy block + item/image pairs, hover interaction under Reduced-Motion, and whether the "three parallax items" are the same three as the hover items.

## Risks and escalations

- **R1 (A6 Column Packing):** This is the largest structural change and is being handled in its own `/grill-with-docs` → `/to-spec` session (decision: separate spec). It touches the approved CMS Content Composition model (ADR 0020) and Content Card model (ADR 0012/0016) and may require an ADR amendment. C2 and D5 are blocked on that separate spec landing; they must not be decomposed until it does.
- **R2 (E2 CMS hover pairs):** Adds a new authorable content structure to the `whoWeAre` singleton (ADR 0013) plus an accessibility-sensitive hover interaction. Decision: handled in its own `/grill-with-docs` → `/to-spec` session (same treatment as A6). Excluded from this spec's decomposition until that spec lands.
- **R3 (Motion consistency, B1/B2/G1):** Changes to shared motion primitives affect every page. Must respect `Reduced-Motion Feedback` and existing Motion Tempo/Easing discipline; regressions here are sitewide.
- **R4 (Accessibility):** Playback controls (E1), gray→white hover reveal (E2), and reduced marquee speed intersect accessibility. Ensure controls are reachable and Reduced-Motion paths are defined.

## Deferred items

The three feature additions are valid but out of scope for this feedback spec; each warrants its own `/grill-with-docs` → `/to-spec` pass before decomposition:

- **Google Analytics** — add GA to the site. Decision: fold into the existing MVP Completion observability scope (`mvp-completion-implementation-spec.md`) rather than a standalone spec.
- **Media crop + focal point** — crop and focal-point selection on Media Assets "where possible." Scope is ambiguous across Sanity image hotspot (native) vs Mux video; needs its own spec.
- **Sentry → Discord + anomaly alerts** — clean up error logging, route Sentry to Discord, and notify Discord of anomalous behavior (traffic, sysadmin-actionable events). Under-specified: define "anomalous," alert thresholds, and ownership. Needs its own spec; touches observability (MVP Completion spec).

## Suggested issue breakdown boundaries

Proposed slice boundaries for a later `to-issues` pass (not tickets yet):

1. **Shared standards foundation:** A1, A2, A3, A4, A5, A7 (hero media playback), A8 (global line cap) — each a shared-primitive slice that page items block on.
2. **Column Packing primitive:** handled in a separate spec (A6/R1). C2 and D5 block on it and are excluded from this spec's decomposition until it lands.
3. **Shared motion:** B1, B2, B3 (sitewide, block G1).
4. **Index page:** C1, C3, C4, C5, C6 (C2 via slice 2).
5. **Home page:** D1, D2, D3, D4, D6 (D5 via slice 2).
6. **Who We Are:** E1, E3, E4, E5 (E2 handled in a separate spec/R2, excluded here).
7. **Shop/item:** F1, F2.
8. **Mobile QA:** G1–G7 (depend on their desktop counterparts and shared standards).
9. **Separate specs (not decomposed from this spec):** Column Packing (A6), Who We Are hover pairs (E2), and the feature track — GA (folds into MVP Completion observability), crop/focal point, Sentry→Discord.
