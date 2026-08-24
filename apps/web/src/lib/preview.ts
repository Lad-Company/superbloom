// Cookie-gated draft preview (docs/content-preview-spec.md). The enable route
// sets the cookie after validating a Studio-signed preview URL; SSR content
// routes, the Footer, and the Layout read it to switch the Sanity client,
// cache headers, motion, and analytics.

export const PREVIEW_COOKIE = 'sb_preview'

// Structural type covers Astro.cookies from pages, layouts, and components.
export function isPreviewRequest(cookies: {
  get(name: string): {value: string} | undefined
}): boolean {
  return Boolean(cookies.get(PREVIEW_COOKIE)?.value)
}
