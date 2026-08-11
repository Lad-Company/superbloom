import type {APIRoute} from 'astro'
import {PREVIEW_COOKIE} from '../../../lib/preview'

// Exits draft mode: clears the cookie and returns to the referring page.
// This is also how share-link recipients leave preview.
export const GET: APIRoute = async ({cookies, request, redirect}) => {
  cookies.delete(PREVIEW_COOKIE, {path: '/'})

  let target = '/'
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const from = new URL(referer)
      // Same-origin only — never turn this into an open redirector.
      if (from.origin === new URL(request.url).origin) {
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
