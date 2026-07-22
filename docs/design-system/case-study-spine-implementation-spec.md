# Case Study Spine implementation specification

**Status:** Target contract, not an implementation-status claim

**Decision source:** [ADR-0017](../adr/0017-case-study-spine.md)

**Earlier design evidence:** [signed-off July 2026 Case Study](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-87&m=dev)

**Current composition authority:** [Figma nodes 1:4790 and 1:4816](https://www.figma.com/design/pAnkxyDKUGGPGmzpp6r87X/SBH-Temp?node-id=1-4816&m=dev)

**Complete composition contract:** [CMS Content Composition implementation specification](./cms-content-composition-spec.md)

## Fixed page contract

Case Study detail pages retain the five required Spine sections in this exact
name, order, and navigation:

1. Highlights
2. Challenge
3. Unexpected Insight
4. Big Idea
5. Results

Editors cannot reorder, rename, retheme, or omit them. The code-owned section
definition supplies labels, IDs, navigation order, and sticky-navigation
behavior. Press and Next Project remain optional modules outside the Spine.

The hero retains client, title, Capability tags, and approved brand-surface
behavior. Optional lead media follows the hero. Legacy metadata does not return.

## Content Layout Rows

Every Spine section may contain ordered Content Layout Rows when supporting
narrative or media is needed. This replaces the earlier Case Study-only layout
objects and the restriction that layouts appear only in the first four sections.

Each row contains one or two blocks:

- **Media block:** a `mediaBox`, a global aspect ratio, and one shared width
  fraction.
- **Text block:** optional plain-text heading, required Portable Text, and one
  shared width fraction.

Shared widths are `1/4`, `1/3`, `1/2`, `2/3`, `3/4`, and `full`. Two blocks must
total `full`. A single narrow block may align left, center, or right. A single
full-width Media block may be full bleed. Global media ratios are `intrinsic`,
`1:1`, `4:5`, `9:16`, `3:2`, `16:9`, and `2:1`.

Below 1024px, all blocks become full width and two-block rows stack in authored
order.

## Results

Results keeps its required fixed stats treatment:

- required `surfaceRole`: `case-primary` or `case-secondary`
- 1-4 stats
- required value and label for every stat

Content Layout Rows in Results provide supporting narrative or media. They do
not replace, weaken, or reorder the stats contract.

## Related modules

- Press references zero to three unique News items and renders only when at
  least one resolves.
- Next Project references zero or one non-self Case Study and renders only when
  it resolves.
- Media uses `MediaFrame`, including alt text, loading, and visibility-aware
  video playback.
- Press and Next Project use their content-specific Content Card adapters.

## Implementation direction

Schema, queries, generated types, components, migration, and tests should adopt
Content Layout Row rather than preserve compatibility with the earlier
Case Study-only media layout objects. Existing code or data that still uses
those objects is migration inventory, not the target model.

Keep the fixed Spine composition and Results stats validation while allowing
rows in all five sections. Verify row cardinality and width totals, Results
stats, fixed section order, responsive stacking, keyboard-operable navigation,
focus states, reduced motion, and media accessibility.
