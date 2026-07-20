# Index Page

The Index Page is the dedicated browse page for long-form editorial content at `/index`. It contains News and Editorial Articles in one reverse-chronological feed by publication date. It excludes Zine Articles and Case Studies.

- **Figma:** [Index](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-600&m=dev)
- **Route:** `/index`
- **Records:** News, Editorial Articles
- **Implementation spec:** [editorial-index-and-article-implementation-spec.md](./editorial-index-and-article-implementation-spec.md)

## Content contract

The Index Page has two sections:

### Featured section

Curated via the `indexPage` singleton:
- One lead card (large, prominent)
- Three secondary cards (smaller grid)
- Featured items are excluded from View All

### View All section

All News + Editorial Articles in reverse-chronological order by publication date, excluding featured items. Supports:
- Sort toggle: newest (default) / oldest
- Progressive Load More: seven records per batch
- Baseline works without JavaScript

## Card presentation

Cards display:
- Card media at editor-selected aspect ratio
- Title
- Overview excerpt
- Publication date
- Optional tags (max 2)

### Card destinations

**News cards:**
- Follow the editor-selected `cardDestination`
- Internal targets use `/news/[slug]`
- External targets require one explicitly primary coverage link, open in a new tab, and include a text-and-icon indicator
- Internal detail page always remains accessible (via subtle secondary link)

**Editorial Article cards:**
- Always link to `/articles/[slug]` internal detail page

## Behavior

- Featured section displays curated lead + three secondary cards
- View All displays all remaining News + Editorial Articles
- Sort control changes order (newest/oldest) via URL query
- Load More loads next seven records
- Works without JavaScript via pagination query params

Visual layout, card treatment, responsive behavior, and interaction follow
[design-language.md](./design-language.md) and the linked Figma screen.
