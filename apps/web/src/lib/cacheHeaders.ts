// Fail-safe edge caching: called explicitly per content page. A page that
// forgets the call is simply uncached, never silently shared-cached.
// Structural type covers both Astro.response and endpoint Response objects.
export function setPublicCache(res: { headers: Headers }, seconds = 60, swr = 86400) {
  res.headers.set(
    'Cache-Control',
    `public, s-maxage=${seconds}, stale-while-revalidate=${swr}`,
  );
}

// Content routes call this instead of setPublicCache. Draft-mode responses
// must never reach the shared edge cache: Vercel keys its cache by URL, not
// cookie, so a cached preview response would serve drafts to the public.
export function setContentCache(res: { headers: Headers }, preview: boolean) {
  if (preview) {
    res.headers.set('Cache-Control', 'no-store');
  } else {
    setPublicCache(res);
  }
}
