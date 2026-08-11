import type {APIRoute} from 'astro'
import {validatePreviewUrl} from '@sanity/preview-url-secret'
import {getSanityClient} from '../../../lib/sanity'
import {PREVIEW_COOKIE} from '../../../lib/preview'

// Enables draft mode for requests carrying a Studio-signed preview URL — the
// Presentation pane and share links both land here. The secret is validated
// against the dataset-stored sanity.previewUrlSecret documents; only then is
// the cookie set.
export const GET: APIRoute = async ({cookies, url, redirect}) => {
  if (!import.meta.env.SANITY_API_READ_TOKEN) {
    return new Response('Preview mode is not configured', {status: 503})
  }

  const {isValid, redirectTo} = await validatePreviewUrl(getSanityClient(true), url.toString())

  if (!isValid) {
    return new Response('Invalid preview URL', {status: 401})
  }

  // Session cookie (no maxAge): share links self-expire when the browser
  // closes. SameSite=None lets the cookie ride the Studio's cross-origin
  // iframe, and Secure is required for SameSite=None.
  cookies.set(PREVIEW_COOKIE, 'true', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  })

  const response = redirect(redirectTo ?? '/')
  response.headers.set('Cache-Control', 'no-store')
  return response
}
