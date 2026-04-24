# Domain Knowledge -- Superbloom House

## Purpose
Website redesign and rebuild for SuperBloom House, migrating from Nuxt.js (Vue) + headless WordPress to a new stack. Includes Shopify e-commerce integration and video content delivery optimization.

## Audience
- **Primary:** Brand marketers and agency buyers evaluating SuperBloom as a creative partner
- **Secondary:** Creators/talent considering joining the Creative Collective
- **Tertiary:** Direct consumers browsing the Flower Shop (merch/capsule collections)

## Business Context
SuperBloom House is an independent media content & production company (founded 2021, Brooklyn + LA). They make creative campaigns, branded entertainment, and social content for major brands (Deel, TripAdvisor, Tyson, Sonic, Marriott, Sundance). They operate a Creative Collective of 300+ creators. They just launched a direct commerce initiative (Flower Shop, April 2026). The website is their primary portfolio and business development tool.

## Technical Context
- **Current stack:** Nuxt.js (Vue) + headless WordPress (api.superbloomhouse.com) + Shopify (existing store)
- **Target stack (recommended):** Next.js (App Router) + Sanity CMS + Shopify Storefront API + Mux or Bunny.net for video + Vercel hosting
- **Alternative stack:** Nuxt 3 + Sanity (faster build, same Vue paradigm)
- **Key technical challenges:** Sophisticated scroll-driven animations, custom video player, creator directory, Shopify integration
- **Scope:** Pete builds templates and CMS structure (~10-15 page templates). Lad/SuperBloom fills in content. No content migration responsibility.
- **Video delivery:** Currently self-hosted from WordPress uploads (no CDN, no adaptive streaming). Major optimization opportunity.
- **Shopify:** Existing integration via Storefront API. Products served from cdn.shopify.com. Checkout redirects to Shopify. Basic plan ($39/mo) sufficient.
- **Timeline:** July 2026 launch target. Half-time engagement (~20 hrs/week).
- **IT managed by:** KoobrikLabs (London/LA)

## Risks
- **July timeline at half-time:** ~200 hours available. Design+dev estimate is 180-270 hours -- tight at high end.
- **Animation fidelity:** Current site sets a high bar. Framework choice must support sophisticated animations (rules out Astro)
- **Lad Company is new:** First engagement as a new agency. Processes may be undefined.
- **Intermediary dynamics:** Pete works through Lad, not directly with SuperBloom. Communication chain adds latency and potential for misalignment.
- **Framer pushback:** Lad suggested Framer. Pete needs to make a convincing case for custom dev using specific technical blockers (see Terrain Map).

## Dependencies
- Lad Company (design/strategy lead)
- SuperBloom House (client, content, Shopify store)
- KoobrikLabs (IT infrastructure, may need to coordinate)
- Shopify (existing commerce platform, staying)

## Competitors
SuperBloom competes with other independent creative agencies:
- Other content/production studios in NYC and LA
- Traditional ad agencies' in-house content arms
- Creator-economy platforms

## Key People
- Briony McCarthy -- CEO & Founding Partner, SuperBloom
- Tom Dunlap -- CCO & Founding Partner, SuperBloom
- Heather Pieske -- CCO & Partner, SuperBloom
- Arietta Tetreault -- Creative Director, Lad Company (ex-Instrument)
- Daniella Bloch -- Strategy Director, Lad Company (ex-Instrument)
- Lauren (last name unknown) -- Partnerships & Delivery, Lad Company
