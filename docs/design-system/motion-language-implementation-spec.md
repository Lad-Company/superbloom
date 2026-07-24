# Controlled Anticipation Motion Language

## Status

Approved specification. This defines the reusable motion system for Superbloom House.

## Purpose

Controlled Anticipation combines Signal's immediate, responsive feedback with Cinema's calm, deliberate type and scene choreography. Motion should make intent legible:

1. acknowledge a visitor action immediately,
2. create a brief, intentional hold where a meaningful change is about to occur,
3. release the next state with clarity.

The system is not a collection of page-specific effects. It is a small set of primitives and recipes that use existing tokens, Surface Roles, Media Frames, navigation, cards, and page compositions.

## Non-negotiable rules

- Use GSAP, ScrollTrigger, and the shared Lenis smooth-scroll module defined by ADR 0021. Do not use Motion or Framer Motion. Lenis is disabled for reduced-motion and no-JS contexts, which retain native scrolling, restoration, and anchors.
- Create every GSAP timeline inside `gsap.matchMedia()` so reduced-motion behavior is a first-class path.
- Use transforms, opacity, `clip-path`, and CSS variables. Do not animate layout properties such as `top`, `left`, `width`, `height`, `margin`, or `padding`.
- Do not animate a whole page with generic fades. Every animation needs a named primitive and a clear state change.
- Motion may not obscure readable type, hide content indefinitely, or require scrolling to reveal essential information.
- Reuse a primitive before introducing a page-local timeline. Only an approved Art-Directed Hero may add one-off choreography.

## Existing system integration

| Existing system | Motion responsibility |
| --- | --- |
| `src/styles/tokens.css` | Owns duration, easing, stagger, and transition CSS variables. |
| `src/layouts/Layout.astro` | Loads only global route-transition and reduced-motion bootstrap behavior. |
| `src/components/Navigation.astro` | Uses Text Link and Contained Control primitives. Navbar routes trigger Route Transition. |
| `src/components/MediaFrame.astro` | Owns visibility-aware media playback. Motion may reveal or parallax its wrapper but must not duplicate playback ownership. |
| Current card implementation files, including `src/components/EditorialCard.astro`, `WorkCard.astro`, `NewsCard.astro`, and `ZineArticleCard.astro` | Use the Content Card recipe: Surface Wipe, media crop shift, and Info reveal. The CMS composition contract governs their target interface. |
| `src/components/blocks/Capes.astro` | Becomes the first Pinned Storytelling reference recipe. Preserve the existing active-media model and replace one-off timing with shared tokens. |
| `SurfaceSection`, `Section` | Keep Surface Role and contrast ownership. Motion components must consume `--bg`, `--fg`, and derived opacity variables rather than raw hues. |

## Motion tokens

Add the following to `src/styles/tokens.css`. The names are semantic, not component-specific.

```css
:root {
  --motion-instant: 120ms;
  --motion-quick: 240ms;
  --motion-standard: 480ms;
  --motion-deliberate: 800ms;
  --motion-chapter: 1200ms;

  --motion-ease-out: cubic-bezier(0.22, 0.8, 0.2, 1);
  --motion-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --motion-stagger-tight: 24ms;
  --motion-stagger-standard: 48ms;
}
```

| Token | Use |
| --- | --- |
| `instant` | press feedback, status confirmation, checkbox/toggle state |
| `quick` | link and contained-control hover |
| `standard` | cards, accordion rows, local content reveal |
| `deliberate` | type reveal, route transition, menu panel |
| `chapter` | Pinned Storytelling only |
| `ease-out` | entrances and local feedback |
| `ease-in-out` | full-viewport Route Transitions |
| linear scrub | ScrollTrigger timelines only |

Elastic, spring, bouncy, and decorative glow easing are not part of the shared language.

## Shared primitives

### 1. Text Link

**Applies to:** inline links, primary navigation labels, editorial metadata links, in-copy calls to action.

**Default:** Underline Draw.

- Rest: underline is absent or reduced to 0% scale.
- Hover/focus-visible: underline draws from reading direction in `quick`.
- Active: underline remains drawn.
- No positional shift, scale, glow, or color inversion is required.
- The underline must be implemented with a pseudo-element or an inner decorative span so layout does not shift.

### 2. Contained Control

**Applies to:** buttons, menu rows, cart actions, form submit controls, card surfaces, pill controls.

**Default:** Surface Wipe.

- Rest: transparent or role-appropriate background.
- Hover/focus-visible: a foreground or accent surface wipes in from the reading direction in `quick`; label and icon change to derived readable foreground.
- Press: compress to `scale(0.98)` during `instant`, then return.
- Disabled: no wipe, no pointer interaction, clear disabled contrast.
- Use the same wipe direction sitewide. Recommended direction is bottom-to-top for horizontal controls and left-to-right for vertical menu rows.

### 3. Type Reveal

**Applies to:** headings, section labels, editorial text entrances, Route Transition labels.

| Content role | Unit | Behavior |
| --- | --- | --- |
| Reading copy and labels | line or word | clipped upward entrance, standard/deliberate timing |
| Standard display heading | word | 16-48ms stagger, deliberate timing |
| Hero display and Route Transition type | character | blur-to-focus plus 12-24px vertical release, deliberate timing |

Rules:

- Default to lines and words. Character animation is reserved for large display moments.
- Split text only after fonts have loaded and only on visible content.
- Split text must be reverted on teardown and re-split after responsive layout changes.
- Use natural case where authored. Do not uppercase content solely to make it feel animated.
- Preserve authored kerning and tracking. Do not apply negative tracking beyond the current design-token type styles.
- Each line wrapper needs `overflow: clip`; animated words or characters need `display: inline-block`.

### 4. Three-Phase Loading

**Applies to:** Media Frame-adjacent async media, cards, CMS-loaded regions, form submission status, shop actions.

1. **Structure:** render the final region dimensions immediately with a skeleton or placeholder.
2. **Progress:** show one meaningful cue, such as media decode progress, a loading label, or an inline status. Avoid generic spinners.
3. **Release:** remove the skeleton and use the destination's local entry motion, usually a short media reveal plus Type Reveal.

Rules:

- Indeterminate interactions expected under 400ms may use only immediate press feedback.
- Never show both a spinner and a skeleton.
- Reserve space to prevent cumulative layout shift.
- Media Frame retains playback ownership. The loading primitive only controls surrounding visual states.

### 5. Route Transition

**Applies to:** only routes reached from the Shared Site Shell's primary Navigation.

- Cover: a Surface Role-aware full-viewport panel enters with `ease-in-out`.
- Hold: destination data and the next page's initial visual state become ready behind the panel.
- Reveal: the panel exits, then the destination hero Type Reveal begins.
- The transition title uses character-level Type Reveal only when the destination has a display title.
- Back/forward navigation receives the same transition only when browser behavior permits it without delaying restoration.

Do not apply full-viewport transitions to:

- cards,
- filters,
- tabs,
- accordions,
- anchors,
- form submissions,
- Shop,
- Cart,
- slugged detail pages,
- other minor routes.

### 6. Pinned Storytelling

**Applies to:** the home page and top-level Work, Who We Are, News & Press, and Zine destinations. It is excluded from Shop, Cart, slugged detail pages, forms, and minor routes.

A recipe must define:

- a pinned viewport region,
- two to four narrative chapters,
- an active content state per chapter,
- a media state per chapter,
- entry and release thresholds,
- a normal-flow continuation after pin release.

ScrollTrigger requirements:

- `scrub` is linear and bounded.
- Pin only the narrative viewport, not the entire document.
- Use a meaningful chapter count, never pin empty space to make the page feel animated.
- Keep keyboard navigation and normal wheel/touch scrolling functional.
- Each pin must have an explicit cleanup function.
- Media must pause when inactive or hidden through `MediaFrame`.

### 7. Depth Layer

**Applies to:** art-directed hero media and Pinned Storytelling chapters.

Use a maximum of three depth planes:

1. content and controls, fixed for readability,
2. primary media or graphic, slow transform linked to scroll,
3. decorative atmosphere, lower opacity and a slightly larger parallax range.

Do not parallax body copy, form fields, navigation labels, or essential controls. Depth is built from transforms and opacity, not filters that obscure reading text.

## Recipes

### Navbar Route Recipe

1. Text Links receive Underline Draw.
2. On activation, apply Contained Control press feedback.
3. Run Route Transition cover.
4. Load route and prepare the destination hero.
5. Run destination Type Reveal after panel release.

### Content Card Recipe

1. Card surface receives Surface Wipe.
2. Media Frame wrapper crops or translates by no more than 3%.
3. Metadata line or tag reveals after the surface wipe begins.
4. Card navigation itself does not use Route Transition.

### Home / Index Chapter Recipe

1. Native scroll enters a bounded Pinned Storytelling region.
2. Section label enters first.
3. Display type uses word reveal, or character reveal only for the opening hero.
4. Active media changes through the existing Media Frame active state.
5. The final chapter releases to normal document flow.

### Case Study Chapter Recipe

1. `CaseStudySpine` remains the fixed narrative anatomy.
2. Each selected art-directed section may use one bounded Pinned Storytelling recipe.
3. Highlights, Challenge, Unexpected Insight, Big Idea, and Results remain independently readable without scroll-linked animation.
4. Do not convert the entire Spine into a single pinned presentation.

### Form and Shop Recipe

1. Inputs and add-to-cart actions use Contained Control feedback.
2. Submission and cart updates use Three-Phase Loading only if the request lasts longer than 400ms.
3. Success and error messages appear immediately in an ARIA live region.
4. No pinning, parallax, route cover, or delayed disclosure.

## Proposed implementation boundary

Create `apps/web/src/lib/motion/`:

| Module | Responsibility |
| --- | --- |
| `config.ts` | tokens, shared GSAP ease names, reduced-motion query |
| `splitText.ts` | font-aware split, responsive re-split, teardown |
| `reveal.ts` | line, word, and character Type Reveal builders |
| `hover.ts` | Underline Draw and Surface Wipe setup |
| `loading.ts` | Three-Phase Loading state coordinator |
| `routeTransition.ts` | navbar-only cover/hold/reveal lifecycle |
| `pinnedStory.ts` | chapter validation, ScrollTrigger setup, cleanup |
| `index.ts` | explicit public exports only |

Create `apps/web/src/components/motion/`:

| Component | Role |
| --- | --- |
| `MotionText.astro` | Emits semantic text wrappers and declarative motion attributes. It does not own page copy. |
| `MotionLink.astro` | Text Link markup and Underline Draw attributes. |
| `MotionControl.astro` | Contained Control markup and Surface Wipe layers. |
| `LoadingSurface.astro` | Reusable structure/progress/release slots. |
| `RouteTransition.astro` | One shared overlay mounted in `Layout.astro`. |
| `PinnedStory.astro` | Receives chapters and composes shared ScrollTrigger markup. |

The public API must remain data-oriented. Pages pass a recipe and semantic content. They must not pass raw GSAP timelines, arbitrary duration values, or raw color values.

## Art-Directed Hero exception

An Art-Directed Hero can add custom sequencing when all conditions hold:

1. it names the base recipe it extends,
2. it uses shared tempo and easing tokens,
3. it preserves the Text Link, Contained Control, Three-Phase Loading, and Reduced-Motion Feedback rules,
4. it owns a teardown path,
5. the behavior is documented next to the hero component.

This exception is for specific storytelling needs, not a way to bypass primitives.

## Reduced-motion behavior

When `prefers-reduced-motion: reduce` matches:

- render all content in its final visible state,
- retain immediate color, Surface Wipe, and Underline Draw state changes,
- remove SplitText stagger and blur,
- remove Pinned Storytelling, scrub, parallax, auto-playing decorative media, and Route Transition panels,
- preserve focus, selected, loading, success, and error states with no delay,
- ensure media uses the existing `MediaFrame` pause behavior.

## Performance and quality gates

- One ScrollTrigger instance per Pinned Storytelling region, not one per child element unless its lifecycle requires it.
- Use `gsap.context()` or equivalent teardown per component.
- Revert SplitText, kill timelines, kill ScrollTriggers, and disconnect observers on navigation/unmount.
- Load GSAP only on routes that use motion primitives beyond CSS hover.
- Avoid `will-change` except while an animation is active.
- Test at desktop and mobile breakpoints, with touch and keyboard navigation.
- Verify no content is clipped after font load or resize.
- Verify card, link, control, loading, and navigation states against every Surface Role.

## Migration plan

1. Promote Lenis from the prototype into `src/lib/motion/smoothScroll.ts` per ADR 0021, synchronized to GSAP's ticker and disabled for reduced-motion.
2. Add motion tokens and the `src/lib/motion/` shared layer.
3. Convert Navigation, Button, and card components to Text Link and Contained Control primitives.
4. Add `LoadingSurface` around selected Media Frame and async states.
5. Implement `RouteTransition` in `Layout.astro`, restricted to navbar routes.
6. Refactor `Capes` into the reference `PinnedStory` recipe.
7. Apply approved recipes to home, Work, Who We Are, News & Press, and Zine.
8. Add only documented Art-Directed Hero exceptions.
9. Remove the prototype route and retain the selected decisions in this specification.

## Acceptance criteria

- Every inline or nav text link uses Underline Draw.
- Every contained interactive surface uses Surface Wipe and consistent press feedback.
- Every async loading region follows Three-Phase Loading when it exceeds 400ms.
- Route Transition runs only for Shared Site Shell navbar routes.
- Pinned Storytelling appears only on approved navbar editorial destinations.
- Shop and Cart have local feedback only.
- Reading copy is never character-split by default.
- Character-level Type Reveal is limited to display heroes and Route Transition labels.
- Reduced-motion mode preserves state feedback while disabling temporal and scroll-driven choreography.
- All motion can be traced to a shared primitive, recipe, or documented Art-Directed Hero exception.
