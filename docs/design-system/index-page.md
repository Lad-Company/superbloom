# Index Page

The Index Page is the dedicated browse page for long-form editorial content. It
is not Work and never lists Case Studies.

- **Figma:** [Index](https://www.figma.com/design/rCLSJfHWU1ka3YiAl1sNPU/-e--Superbloom---Work-Share?node-id=2554-600&m=dev)
- **Records:** News (including press coverage), Zine Articles, and future
  editorial records

## Content contract

- Each entry has a publication date, destination, media, title, and contextual
  metadata appropriate to its content type.
- Entries appear in one reverse-chronological feed by publication date.
- Cards are content adapters of `EditorialCard`; they do not share a universal
  content model with Case Studies.
- The page may progressively reveal more entries, but all entries remain
  reachable without JavaScript.

Visual layout, card treatment, responsive behavior, and interaction follow
[design-language.md](./design-language.md) and the linked Figma screen.
