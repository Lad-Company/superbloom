// Cookie-gated draft preview (docs/content-preview-spec.md). The enable route
// sets the cookie after validating a Studio-signed preview URL; SSR content
// routes, the Footer, and the Layout read it to switch the Sanity client,
// cache headers, motion, and analytics.

export const PREVIEW_COOKIE = 'sb_preview'

// The Presentation tool appends this query param to every URL it opens
// outside the iframe — the "Open preview" popup and the enable route's
// redirect target both carry it. It is the only signal a top-level tab gets
// when the cookie never arrived (the iframe sets it cross-site, so Firefox
// partitions it and Safari/Chrome-with-3p-blocking drop it, and the 8-hour
// Max-Age can lapse): Layout uses it to say "preview is NOT active" instead
// of silently showing published content.
export const PREVIEW_PERSPECTIVE_PARAM = 'sanity-preview-perspective'
export const PREVIEW_VARIANT_PARAM = 'sanity-preview-variant'

// Structural type covers Astro.cookies from pages, layouts, and components.
export function isPreviewRequest(cookies: {
  get(name: string): {value: string} | undefined
}): boolean {
  return Boolean(cookies.get(PREVIEW_COOKIE)?.value)
}

// True when the URL carries the Presentation tool's preview marker — i.e. the
// user arrived via "Open preview" or a share-link redirect. Combined with
// isPreviewRequest this distinguishes three states: previewing (cookie),
// preview requested but inactive (param, no cookie), and normal traffic.
export function hasPreviewParam(url: URL): boolean {
  return url.searchParams.has(PREVIEW_PERSPECTIVE_PARAM)
}

// Backs the "preview inactive" pill across navigations: the perspective
// param only rides the landing URL, so Layout stamps this marker when it
// renders the inactive state and reads it on later requests. Not HttpOnly —
// nothing client-side reads it today, but nothing sensitive either; the
// value only ever says "a preview open failed in this browser". The enable
// route clears it on success and the disable route clears it on exit, so it
// can never outlive a real session; the 8-hour Max-Age is the backstop.
export const PREVIEW_INACTIVE_COOKIE = 'sb_preview_inactive'

export function isPreviewInactiveRequest(
  cookies: {get(name: string): {value: string} | undefined},
  url: URL,
): boolean {
  if (isPreviewRequest(cookies)) return false
  return hasPreviewParam(url) || Boolean(cookies.get(PREVIEW_INACTIVE_COOKIE)?.value)
}
