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

  // Bounded lifetime: a session cookie was the original intent ("share links
  // self-expire when the browser closes"), but Chrome's "Continue where you
  // left off" restores session cookies indefinitely, silently stranding
  // editors in draft mode on the production URL. Eight hours covers one
  // editor workday; the preview bar's Exit affordance ends a session early.
  // SameSite=None lets the cookie ride the Studio's cross-origin iframe, and
  // Secure is required for SameSite=None.
  cookies.set(PREVIEW_COOKIE, 'true', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  const response = redirect(redirectTo ?? '/')
  response.headers.set('Cache-Control', 'no-store')
  return response
}
