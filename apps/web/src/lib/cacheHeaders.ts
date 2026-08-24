// Fail-safe caching: called explicitly per route. A route that forgets the
// call is simply uncached, never silently shared-cached.
// Structural type covers both Astro.response and endpoint Response objects.

// Shared/edge caching is reserved for cookie-independent endpoints (sitemap).
// Content HTML must never use it: Vercel's edge cache keys by URL, not
// cookie, so a cached published page gets served to requests carrying the
// sb_preview draft cookie — silently hijacking preview sessions (and the
// stale-while-revalidate window kept each hijacked URL broken for up to a
// day). See docs/content-preview-spec.md §11.
export function setPublicCache(res: {headers: Headers}, seconds = 60, swr = 86400) {
  res.headers.set('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=${swr}`)
}

// Content routes call this instead of setPublicCache. Draft-mode responses
// are never stored anywhere; published HTML may sit in the browser's cache
// but always revalidates, and never reaches a shared cache. Preview
// correctness beats the ~80ms an edge hit saved; ISR + bypassToken is the
// path back to edge-cached HTML if that trade ever reverses.
export function setContentCache(res: {headers: Headers}, preview: boolean) {
  if (preview) {
    res.headers.set('Cache-Control', 'no-store')
  } else {
    res.headers.set('Cache-Control', 'private, no-cache')
  }
}
