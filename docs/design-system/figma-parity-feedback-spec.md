# Superbloom Figma-Parity Feedback Specification

## Context

This specification consolidates the supplied design-review feedback and the inspected Figma references into a page-by-page parity plan. It applies to an unlaunched, intentionally media-heavy marketing site.

The immediate objective is visual and interaction fidelity, not system purity. Each page may use temporary page-specific work where required to reach the approved design. Once pages reach parity, a separate consolidation pass will convert repeated patterns into composable, reusable primitives.

### Source Figma references

- [Zine, node 1:4690](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4690&m=dev)
- [Index, node 1:4790](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4790&m=dev)
- [Article, node 1:4841](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4841&m=dev)
- [Case study item, node 1:4553](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4553&m=dev)
- [Who We Are, node 1:4656](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4656&m=dev)
- [Our Work, node 1:4670](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4670&m=dev)
- [Homepage, node 1:4677](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4677&m=dev)

## Goal

Bring Homepage, Our Work, case studies, Who We Are, Index, Zine, and article templates into close Figma parity for:

- layout, type scale, page gutters, color, and corner treatment;
- page composition and section order;
- Figma copy and content hierarchy;
- real media placement, preferably video;
- pointer, hover, scroll-jack, sticky, carousel, and accordion behavior;
- navigation, contact, and footer variants.

## Non-goals

- Automated visual-regression testing or approval.
- A global component-system refactor before visual parity is reached.
- Producing final production media. Existing Sanity media is sufficient for initial seeding and will be client-replaceable.
- Treating accessibility constraints as the primary design driver. No-JavaScript and required accessibility contexts may bypass scroll-jack behavior, but design fidelity takes precedence in the normal experience.

## Operating Decisions

| Topic | Decision |
| --- | --- |
| Figma inspection | Inspect actual node structure and content. Do not use screenshots as a substitute for design inspection. |
| Copy and content | Follow Figma copy, ordering, and content hierarchy as closely as available content permits. |
| Media | Prefer video. Reuse video where appropriate. Seed from existing Sanity media first. Request a specific Figma node only when a needed aspect ratio or media treatment cannot be inferred or supplied by existing media. |
| External Index links | The card itself opens the external URL in a new tab. Remove the `Read Externally` label without replacement. |
| Missing next project | Hide the entire Next Project section when no eligible project is available. |
| Interaction primitives | Retain acceptable existing primitives, repair broken states, and add missing page-level behavior. Full normalization follows page parity. |
| Scroll-jack | Keep scroll-jack interactions where specified. Provide an alternate non-scroll-jacked path only when JavaScript is unavailable or an accessibility requirement requires it. |
| Validation | Human Figma comparison and feedback are the validation loop. Do not add automated cross-page visual-regression work. |
| Delivery | One page equals one parity ticket. Complete page fidelity first, then perform a reusable-component and system sweep. |

## Shared Requirements

### Navigation

**Requirement:** Navigation must choose and retain the Figma contrast variant for each page and background.

**Acceptance criteria**

- Homepage, Zine, Who We Are, Our Work, article, case study, and Index use their corresponding light or dark navigation treatment.
- Navigation labels never disappear because text, logo, control, or border colors fail to change with the intended surface.
- `Let’s Chat` and `Shop` retain the Figma contrast, border, fill, and text treatment for the active page context.
- Page transitions or scrolling do not leave navigation in an inappropriate prior contrast state.

### Shared cards, tags, buttons, and media containers

**Requirement:** Match the Figma card language while allowing page-specific composition during the parity phase.

**Acceptance criteria**

- Media cards support portrait, square, landscape, and wide aspect ratios used in Figma.
- Media tags appear in the top-left over media where designed, with translucent, blurred treatment.
- Cards have defined hover behavior. Hover must not make buttons disappear, turn unreadable, or become fully black unless Figma explicitly dictates it.
- Reusable arrow controls are present where Figma shows them.
- Media uses intended crop positioning and overlays, not generic `object-fit` defaults where these create visible mismatch.

### Gutter, radius, and typography alignment

**Requirement:** Use the Figma layout values consistently within every parity page.

**Acceptance criteria**

- Desktop reference layouts use the designed 32px page margin and 24px page gutter unless a Figma section explicitly breaks those values.
- Content must not unintentionally hit the browser’s far-left edge.
- Index cards use hard corner treatment, not the current overly soft radius.
- Footer, fields, buttons, tags, and cards use the Figma-specific radius treatment, including the rounded footer treatment requested in review.
- Newsletter input values render in the Graphik/body font, not display or eyebrow typography.

### Motion and interaction

**Requirement:** Motion must express the Figma composition rather than adding generic animation.

**Acceptance criteria**

- Hover, reveal, carousel, sticky, scroll-jack, and accordion states have a visible, stable active state.
- Scroll-jacked sections do not infinite-loop, remain static, or create empty progression.
- The normal JavaScript experience prioritizes visual impact and parity.
- A fallback presentation is allowed for no-JavaScript and explicitly required accessibility modes.

### Footer

**Requirement:** Correct the shared footer wherever it appears.

**Acceptance criteria**

- The email input and submit button appear as a horizontal control group to the right of `Subscribe to the Microdose`.
- The subscription field uses the body font while typing.
- The correct Email placeholder is used, not Name.
- The footer has intended rounded outer treatment and page-specific background contrast.
- Existing navigation, office, social, and copyright content remains structurally aligned with the Figma footer.

## Homepage

### Reference composition

The Figma Home reference contains: overlay hero, horizontal News rail, `Built for brands with bigger ambitions`, service/capabilities scroll sequence, `Our Work`, Creative Collective section, Zine feature, `What they’re saying`, contact, and footer.

### Hero

**Requirement:** Preserve the composed, media-led hero with headline and supporting copy.

**Acceptance criteria**

- The hero follows the Figma overlay composition: large `We create the unexpected.` headline over media, with the supporting independent-creative-company copy in the right column.
- Hero media is seeded from Sanity, preferring video.
- Navigation uses the hero’s intended contrast variant.

### News rail

**Requirement:** Restore the horizontal news presentation below the hero.

**Acceptance criteria**

- News cards include their top-left labels/tags.
- Cards have centralized, intentional hover behavior.
- The rail is horizontally presented without a visible native scrollbar.
- Scroll-jacking maps vertical scroll progression to the horizontal rail while it is active.
- The rail does not trap at an empty end state and remains usable as a normal horizontal presentation in the fallback path.

### Built for Brands with Bigger Ambitions

**Requirement:** Add the missing feature section.

**Acceptance criteria**

- Section title is `Built for brands with bigger ambitions.` and follows the Figma’s large-scale composition.
- Two asymmetrically placed media blocks appear to the right of the statement.
- Both media blocks respond to pointer movement in the intended bounded, mouse-following treatment.
- Seed with video where possible and preserve the mixed aspect ratios represented in Figma.

### Capabilities sequence

**Requirement:** Replace the broken infinite-scroll behavior with the sticky scroll-driven capabilities composition.

**Acceptance criteria**

- Section uses the specified capabilities: Strategy, Creative, Production, Entertainment, Experiential, Media, Social, and Creators.
- The left-side contextual copy remains sticky during the active sequence.
- The right-side capability list advances vertically, with one visibly active item at a time.
- Supporting subtext appears only in the left content area, not beneath the right-side list items.
- The associated image or video changes when the active capability changes.
- The section uses a finite scroll range and ends cleanly. It must not endlessly scroll with unchanged content.

### Our Work

**Requirement:** Add the omitted homepage work section.

**Acceptance criteria**

- Section title is `Our Work`.
- `View all` routes to the main Our Work page.
- The work-card composition follows the deliberately offset and mixed-size Figma layout rather than a generic equal grid.
- Cards use seeded media, real project titles and descriptions where available, and visible interactive states.

### Creative Collections

**Requirement:** Add the omitted Creative Collections section below Our Work.

**Acceptance criteria**

- Section follows Our Work in the page order.
- The section follows Figma’s `The Creative Collective.` title, supporting copy, media column, and `Explore our collective` CTA.
- The media presentation and copy support the current Sanity seed data, with client-replaceable video/image content.

### Zine and press

**Requirement:** Preserve the existing Zine section and add the omitted press destination.

**Acceptance criteria**

- The homepage Zine module matches the Figma issue feature hierarchy and links to the issue.
- `What they’re saying` appears beneath the Zine module.
- `View all news & press` routes to the Index/news-and-press destination.

### Homepage footer

Apply the shared Footer requirements.

## Our Work

### Reference composition

The Figma page is a dark page with `Unexpected minds. Unignorable work.` hero, a principal Deel work item, an `All work` sequence of mixed card groupings, contact, and footer.

### Hero and navigation

**Requirement:** Correct hero wrapping and contrast.

**Acceptance criteria**

- `Unexpected minds. Unignorable work.` wraps according to the two-line Figma composition at the reference viewport, not the current four-line result.
- Dark-page navigation text and controls use the white/inverted treatment and remain legible.
- Remove the separate `Featured` heading. The principal hero card itself is the featured work item.

### Principal work item

**Requirement:** Present the featured project as the page’s principal work hero.

**Acceptance criteria**

- The featured card uses the prominent Figma position, scale, media, title, tags, and descriptive copy.
- Populate using an existing project and available media, with video preferred.
- Card behavior is intentional and does not require a redundant section heading.

### All Work

**Requirement:** Match the Figma all-work progression rather than a generic grid.

**Acceptance criteria**

- `All work` begins after the featured item.
- Content respects the 32px outer gutter and 24px inter-card gutter. No row may incorrectly touch the far-left edge.
- Card groupings, staggered widths, and mixed composition follow Figma.
- Scrolling through work cards has the requested visual animation/progression.
- Hover states preserve readable titles, labels, and CTAs.

### Contact and footer

**Requirement:** Match the Figma pink contact band and shared footer.

**Acceptance criteria**

- Contact section follows its Figma color, hierarchy, field layout, and control treatments.
- Footer follows the shared Footer requirements.

## Case Studies

### Case-study content policy

**Requirement:** Seed case studies with Figma-shaped content and media rather than text-only templates.

**Acceptance criteria**

- Case studies use actual seeded media in hero and body sections.
- Prefer existing Sanity video. Reuse an appropriate video when a project lacks enough unique media.
- Use Figma media placements and aspect ratios as the layout source of truth.
- Content quantity supports the designed pacing, including full-width media, text/media pairs, portrait media, square pairs, results, and next-project treatment where designed.
- Replacement by client media later does not require rebuilding layouts.

### Case study item template

**Requirement:** Support the Figma project structure represented by the Tyson reference.

**Acceptance criteria**

- Hero contains project/brand eyebrow, display title, service tags, theme color, and hero media.
- Content supports labeled narrative modules such as Highlights, Challenge, Unexpected Insight, and Big Idea.
- Content supports offset text plus media, media plus text, two-up square media, and large wide media blocks.
- Results support several large metrics with explanatory captions.
- The page supports a themed Next Project block.
- The theme, nav contrast, contact color, and footer variant adapt to each project.

### Deal

**Requirement:** Complete Deal beyond its current relatively complete text structure.

**Acceptance criteria**

- Add media within the content, not only the initial hero.
- Add Next Project at the end when an eligible next item exists.
- Hide the complete section when no next item is available.
- Preserve Deal’s current strengths while conforming it to the richer Figma case-study sequence.

### D1

**Requirement:** Maintain D1’s relative fidelity while applying template-level improvements.

**Acceptance criteria**

- D1 retains its established layout and contrast treatment.
- It receives shared content/media behavior only where the Figma case-study template calls for it.
- Do not regress D1 while seeding or extending the case-study content model.

## Who We Are

### Reference composition

The Figma reference includes black hero, blue hero media, large category marquee, hoverable company statement, three information cards, `Our unfair advantage` media/text sequence, services listicle, two CTA cards, FAQ, blue contact, and footer.

### Hero and navigation

**Requirement:** Correct visual contrast and Figma wrapping.

**Acceptance criteria**

- Navigation uses the white/inverted variant over the black hero.
- `Audiences move fast. We help you move faster.` wraps to the intended three-line Figma composition instead of four lines.
- The blue hero-media band is present with seeded media, preferably video.

### Category sequence

**Requirement:** Restore the Campaigns/Content/etc. scroll experience.

**Acceptance criteria**

- The prominent category sequence includes Campaigns, Content, Experiences, Branded Entertainment, Social, Strategy, and Creative.
- It behaves as a scroll-jacked/sticky sequence, not a static or broken marquee.
- Active category state, supporting media, and progression are visible as the user moves through the sequence.

### Interactive company statement

**Requirement:** Apply the intended hover treatment to `Superbloom is an independent creative company`.

**Acceptance criteria**

- The phrase `independent creative company` receives the Figma-directed mouse-hover text effect.
- The surrounding subdued and active copy contrast is preserved.
- The effect does not cause text to jump, disappear, or overlap.

### Founded, Team, and Clients cards

**Requirement:** Add entry animation to the three colored information cards.

**Acceptance criteria**

- Founded, Team, and Clients cards animate into view using the intended visual language.
- Their respective Figma colors, hierarchy, and content remain intact.
- Client names remain legible and do not collapse into generic placeholders.

### Our Unfair Advantage

**Requirement:** Make the section a meaningful scroll-jacked story.

**Acceptance criteria**

- Heading is `Our unfair advantage`.
- Each text-and-media item becomes the active screen during progression.
- Include Figma content and order: `Everyone. Everywhere. All at once.`, `The brief defines the team.`, and `300+ nontraditional minds.`
- Each item pairs its active copy with intended media, preferring video.
- Section ends cleanly and does not behave as an ordinary static list.

### Services listicle

**Requirement:** Correct listicle alignment and spacing.

**Acceptance criteria**

- The services list follows the Figma top-border row structure.
- Header and description align to the top of each row, not the bottom.
- Include Strategy, Creative, Experiential, Social, Production, Entertainment, Media, and Creators.
- Descriptions follow the Figma service framing, not placeholder copy.

### CTA cards

**Requirement:** Correct the two cards below the listicle.

**Acceptance criteria**

- `Bring us the brief. We'll bring you the brains.` and `Have an unexpected perspective? The collective is always growing.` are present with media.
- CTAs have intrinsic, left-aligned width rather than filling the container.
- Hover states remain visible and readable. They must not disappear or turn into a black void.

### FAQ

**Requirement:** Add a deliberate animated open and close state.

**Acceptance criteria**

- FAQ remains in the Figma two-column layout with title and question list.
- Opening a question visibly animates the content and indicator between closed and open states.
- The animation matches the site’s visual language rather than appearing as an unstyled instant jump.

### Contact and footer

**Requirement:** Match the blue contact module and shared footer.

**Acceptance criteria**

- Contact section uses the Figma blue surface and correct field/control contrast.
- Footer follows shared Footer requirements.

## Index / News and Press

### Reference composition

The Figma Index page includes `What they’ve been saying` hero, a featured asymmetric news layout, `View all` with a `Sort by date` control, mixed-aspect editorial cards, Load More, contact, and footer.

### Metadata, links, and cards

**Requirement:** Correct the editorial card model.

**Acceptance criteria**

- Dates use `DD.MM.YY`, for example `06.06.26`.
- Every card exposes a title and relevant category/tag labels.
- Cards have a visible hover state.
- Clicking any card opens its external URL in a new tab.
- Remove the separate `Read Externally` label. Do not replace it with another label.
- Card corners use Figma’s hard radius, not the softer current radius.

### Hero and featured layout

**Requirement:** Match the visual hierarchy at the top of the page.

**Acceptance criteria**

- Hero is `What they’ve been saying` with intended two-line display treatment.
- The lead item and adjacent compact list cards follow the asymmetric Figma composition.
- Tags appear over media at upper left.
- Use actual Index content, labels, dates, and media where available rather than generic placeholder labels.

### All items and sort

**Requirement:** Restore Figma’s item progression and animated list behavior.

**Acceptance criteria**

- `View all` and `Sort by date` presentation matches Figma.
- Mixed square and landscape cards follow the designed arrangement.
- The listicle has an active/progress animation while moving through items.
- Load More remains available if the content model paginates.

### Contact and footer

**Requirement:** Match the green contact band and shared footer.

**Acceptance criteria**

- Contact band uses Figma’s green background and copy.
- Footer follows shared Footer requirements.

## Article

### Reference composition

The article reference is a black editorial template with an article headline, lead wide media, labelled editorial blocks, full-width and mixed-ratio media, related articles, contact, and footer.

### Article hero and body

**Requirement:** Ensure article pages preserve the editorial Figma sequence.

**Acceptance criteria**

- Article headline, lead media, and black navigation treatment match Figma.
- The lead image/video is wide (16:9 reference ratio) and seeded with actual media.
- Editorial body supports an Overview block, rich body copy, intermediate display headings, and full-width or two-up media at Figma positions.
- Maintain the wide editorial text column and left structural spacer shown in Figma.
- Use Figma copy where it exists and do not replace it with arbitrary generic copy.

### Related articles

**Requirement:** Add the end-of-article related content row.

**Acceptance criteria**

- Related content contains three media cards with title and `Read more` CTA treatment.
- Cards use real seeded content and available media.
- Preserve black-page contrast and the intended button treatment.

### Contact and footer

**Requirement:** Match the blue contact block and shared footer.

**Acceptance criteria**

- Contact fields and copy follow the Article reference.
- Footer follows shared Footer requirements.

## Zine

### Reference composition

The Zine reference includes issue hero, recurring editorial/parallax block, Letter from the Editor, More Stories horizontal rail, Past Zines list, contact, and footer.

### Hero

**Requirement:** Preserve the two-part Zine title hierarchy.

**Acceptance criteria**

- The small header is the issue number, for example `Issue No. 5`.
- The larger header is the issue name, for example `The Gardening Issue`.
- The title overlays the Figma hero media composition.
- Seed the hero with available video where possible.

### Recurring editorial/parallax block

**Requirement:** Add the recurring Zine statement and media collage below the hero.

**Acceptance criteria**

- Include: `Original stories, interviews, and visual essays from the Creative Collective on what helps ideas grow.`
- Use the black block with behind-text collage/parallax media behavior shown in Figma.
- Include `Explore the Issue`.
- Build this as a repeatable Zine-item composition so it can remain consistent across issues.

### Letter from the Editor

**Requirement:** Complete the editorial feature.

**Acceptance criteria**

- Include the Letter from the Editor media card, headline, Figma editorial copy, and `Read the zine` CTA.
- Use Figma copy and hierarchy for the current issue wherever supplied.
- Seed with available media rather than leaving the section text-only.

### More Stories

**Requirement:** Restore the dark horizontal content rail.

**Acceptance criteria**

- `More stories` uses scroll-jacked horizontal progression.
- Previous and next arrow controls are visible and functional.
- Story cards include media, title, supporting description where designed, and `Read more` controls.
- The horizontal rail does not expose an unwanted native scrollbar.

### Past Zines

**Requirement:** Add the missing past-issue index.

**Acceptance criteria**

- Section heading is `Past Zines`.
- Present issue rows with cover media, issue number, title, and `Read more`.
- Include the Figma sequence where content is available: Issue No. 1 `The End of Reality`, Issue No. 2 `Revenge of Creative`, Issue No. 3 `Cheer and Loathing`, and Issue No. 4 `The Attention Issue`.
- Maintain the Figma first-row highlight and subsequent dark list-row treatment.

### Contact and footer

**Requirement:** Match the green contact module and shared footer.

**Acceptance criteria**

- Contact block follows Zine Figma coloring and controls.
- Footer follows shared Footer requirements.

## Dependencies and Content Constraints

### Required content work

- Inspect existing Sanity media before asking for new assets.
- Seed every media placeholder that is needed to validate composition, prioritizing video.
- Reuse media where practical during the parity phase.
- Request exact Figma node definitions only when additional media aspect ratios or positioning details are necessary.
- Seed existing case-study, article, index, Zine, past-issue, and next-project relations where those content records exist.

### Required implementation capabilities

- Background-aware navigation variants.
- Video-capable media cards with fixed aspect-ratio variants and crop positioning.
- Sticky scroll sequences with a finite active index and media switching.
- Horizontal rail/carousel with wheel-to-horizontal progression and visible controls.
- Pointer-follow media treatment.
- Visibility-aware entry animation.
- Animated FAQ state.
- Optional/conditional related-content sections that fully hide when data is absent.

## Risks and Escalations

| Risk | Handling |
| --- | --- |
| Existing Sanity media cannot serve a required ratio or treatment | Request the exact Figma node definition and identify the required ratio and intended crop behavior. |
| Figma contains placeholder content | Use closest available approved content and preserve the placeholder’s hierarchy and spatial role. |
| Scroll-jack conflicts with fallback requirements | Preserve design-led JavaScript behavior. Supply only a pragmatic no-JavaScript or required-accessibility fallback. |
| Page parity produces duplicate one-offs | Accept during page passes. Capture consolidation opportunities for the final reusable-system sweep. |
| Missing next-project relation | Hide Next Project completely. Do not show an empty container or a generic fallback card. |

## Deferred Work

These items are intentionally deferred until after individual page parity:

1. Normalize page-specific implementations into shared, composable components.
2. Establish final global motion timing and easing tokens from approved parity implementations.
3. Perform a cross-page cleanup of card, media, nav, footer, and form primitives.
4. Conduct formal accessibility refinement beyond required fallback behavior.
5. Automated visual-regression setup and review.

## Suggested Page-Level Ticket Boundaries

1. **Homepage Figma parity**: hero, News rail, Built for Brands, capabilities sequence, Our Work, Creative Collective, Zine, press, contact/footer.
2. **Our Work Figma parity**: hero, featured project, All Work composition, scroll progression, contact/footer.
3. **Case-study Figma parity**: media-capable template, Tyson/D1 shape, Deal completion, seeded content, Results, optional Next Project.
4. **Who We Are Figma parity**: hero, category sequence, hover copy, animate-in cards, Unfair Advantage, service rows, CTAs, FAQ, contact/footer.
5. **Index Figma parity**: metadata, external-card links, feature layout, sort, item progression, contact/footer.
6. **Article Figma parity**: editorial body structure, seeded media, related articles, contact/footer.
7. **Zine Figma parity**: issue hero, recurring editorial block, Letter from the Editor, More Stories, Past Zines, contact/footer.
8. **Post-parity system sweep**: consolidate successful patterns into reusable primitives without reducing approved fidelity.

## Review Gate

This document is a specification only. It does not authorize implementation, ticket creation, or automated visual regression.

Open questions that may block a page should be raised only when existing Sanity media cannot represent the needed Figma aspect ratio, crop, or interaction. Otherwise, page work should proceed with the current decisions and be reviewed visually against Figma.
