# Mux for video

Mux is the video storage, transcoding, and delivery provider. The `sanity-plugin-mux-input` plugin is the decisive factor: editors upload video inside Sanity Studio → Mux transcodes → the frontend renders `<mux-player playback-id="...">` as a web component with no React island required. The current site uses ~60 Vimeo embeds; migrating to Mux delivers AV1 + storyboard thumbnails and removes the Vimeo dependency. Cost is effectively negligible (~$0.12/month at 1080p Plus for the existing 60-video library).

**Considered options**: Mux, Bunny CDN, Cloudflare Stream, Vimeo, YouTube

**Why not Bunny**: No first-party Sanity plugin; the editor workflow would require a separate upload step.

**Why not Cloudflare Stream**: Superbloom has no Cloudflare presence anywhere; no consolidation benefit.

**Why not Vimeo**: Vimeo Business is $600/year with no native Sanity integration. Mux is ~$2/year for the same library.

**Why not YouTube**: YouTube's SEO/AEO advantage is real but applies to the wrong content type and the wrong surface. The evidence:

1. **AEO citations are for tutorials, not portfolio work.** YouTube accounts for ~29.5% of Google AI Overview citations (BrightEdge, 2026) — but those citations are for how-to, tutorial, pricing, and product-demo queries. Superbloom's website videos are brand portfolio reels and Case Study showcases: nobody is querying an answer engine for "how did Superbloom make the Virgin Voyages campaign." The AEO advantage does not apply to this content.

2. **A YouTube channel and YouTube website embeds are independent decisions.** Superbloom can — and arguably should — publish key work to a YouTube channel for discovery. That is orthogonal to how the website hosts video. Publishing to YouTube for reach does not require embedding YouTube on the website.

3. **YouTube embeds actively hurt website SEO.** A single YouTube iframe adds 1.3–2.6 MB and 20+ HTTP requests before anyone clicks play (Swarmify benchmark, Chrome 126, May 2026). This degrades Largest Contentful Paint (LCP) and Interaction to Next Paint (INP) — both confirmed Google ranking signals. Mux avoids this entirely.

4. **YouTube injects ads and competitor content.** YouTube's Terms of Service allow it to run pre-roll and mid-roll ads on any embedded video, including non-monetised channels. There is no mechanism to prevent a competitor's ad playing over a Case Study embed. The `rel=0` parameter (related video suppression) and `modestbranding` are both deprecated as of 2023–2024; neither can be relied upon.

5. **Mux achieves equivalent Google indexability.** VideoObject structured data (JSON-LD) makes Mux-hosted videos fully discoverable and eligible for video rich results in Google Search — the same indexing pathway that matters for the website's own SEO. YouTube embeds do not provide additional indexing benefit for content already described by structured data on the page.

**Recommendation on YouTube channel strategy**: Separately from website hosting, Superbloom should consider maintaining a YouTube presence for discovery. This is a content distribution decision, not a video infrastructure decision, and should be handled at the content strategy level.
