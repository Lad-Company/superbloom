# Hybrid SSR for content pages

The Astro app uses `output: 'hybrid'`. Content-bearing routes (Case Study, Capability, Team Member, Zine Issue, Zine Article, News, etc.) render on the server per request, reading from Sanity at request time. Marketing-leaning static surfaces (homepage sections, legal pages) prerender at build.

This is a refinement of ADR-001, which framed Astro as static-leaning. SSR for content was chosen so editor changes appear on the live site immediately rather than waiting on a webhook-triggered rebuild. Each content pageview costs one Vercel function invocation; at expected traffic this is well within Vercel's free tier and far simpler than coordinating an ISR or webhook-rebuild pipeline.

**Considered options**: pure static + Sanity webhook → Vercel deploy hook (full rebuild on publish), static + Astro on-demand revalidation (ISR), hybrid SSR for content routes.

**Why not pure static + rebuilds**: Editors see a 1–3 minute delay between publishing and seeing changes live, which causes recurring "is it broken?" support load. Build minutes also scale with edit frequency.

**Why not ISR**: ISR would buy back static-fast responses but adds a webhook plumbing layer (publish event → revalidate this route's tag) that is non-trivial to keep correct as the schema evolves. Not worth the complexity at this scale.

**Caching**: Vercel CDN caching of SSR responses is intentionally not used. If a future need emerges, per-route `Cache-Control` with stale-while-revalidate is the path; revisit then.

**Reversibility**: Astro lets routes opt into `prerender = true` per-file. Switching individual routes back to static is a one-line change, so this is not a one-way door.
