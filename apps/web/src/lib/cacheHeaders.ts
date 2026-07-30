// Fail-safe edge caching: called explicitly per content page. A page that
// forgets the call is simply uncached, never silently shared-cached.
// Structural type covers both Astro.response and endpoint Response objects.
export function setPublicCache(res: { headers: Headers }, seconds = 60, swr = 86400) {
  res.headers.set(
    'Cache-Control',
    `public, s-maxage=${seconds}, stale-while-revalidate=${swr}`,
  );
}
