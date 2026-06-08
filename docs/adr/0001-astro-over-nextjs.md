# Astro over Next.js

Superbloom's site is content-heavy with only ~4–5 real interactive surfaces (cart, creator filter, video player, contact form, mobile nav). Astro's Islands architecture matches this shape; Next.js would be over-provisioned. The main cost of choosing Astro is losing the Next.js Commerce template, which means writing Shopify cart integration from scratch — acceptable because the shop is not central to the project.

**Considered options**: Next.js (App Router), Astro with React islands
**Why not Next.js**: The Commerce template saves ~1–2 weeks of Shopify wiring that isn't needed here. GSAP/Lenis/Motion run unchanged in Astro's React islands, so the animation concern from early SoW discussions is moot. Next.js would add SSR infrastructure cost and complexity for a site where most pages are static.
