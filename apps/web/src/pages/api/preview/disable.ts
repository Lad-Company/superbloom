import type {APIRoute} from 'astro'
import {
  PREVIEW_COOKIE,
  PREVIEW_INACTIVE_COOKIE,
  PREVIEW_PERSPECTIVE_PARAM,
  PREVIEW_VARIANT_PARAM,
} from '../../../lib/preview'

// Exits draft mode: clears the cookie and returns to the referring page.
// This is also how share-link recipients leave preview.
export const GET: APIRoute = async ({cookies, request, redirect}) => {
  cookies.delete(PREVIEW_COOKIE, {path: '/'})
  // Exit is explicit, so the "preview inactive" notice must not reappear:
  // drop the marker cookie and strip the preview params off the redirect
  // target — otherwise the landing URL would re-arm the notice.
  cookies.delete(PREVIEW_INACTIVE_COOKIE, {path: '/'})

  let target = '/'
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const from = new URL(referer)
      // Same-origin only — never turn this into an open redirector.
      if (from.origin === new URL(request.url).origin) {
        from.searchParams.delete(PREVIEW_PERSPECTIVE_PARAM)
        from.searchParams.delete(PREVIEW_VARIANT_PARAM)
        target = `${from.pathname}${from.search}`
      }
    } catch {
      // Malformed referer — fall through to '/'.
    }
  }

  const response = redirect(target)
  response.headers.set('Cache-Control', 'no-store')
  return response
}
