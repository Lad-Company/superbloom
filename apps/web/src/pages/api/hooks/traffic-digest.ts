import type {APIRoute} from 'astro'
import * as Sentry from '@sentry/astro'
import {postActivity} from '../../../lib/discord'
import {safeCompare} from '../../../lib/hookSecurity'
import {fetchTrafficDigest, renderDigest} from '../../../lib/ga4'

// Invoked daily by Vercel Cron (see apps/web/vercel.json). Vercel sends
// `Authorization: Bearer $CRON_SECRET` automatically when that env var exists.
// The digest always reports the last completed UTC day, so Hobby-tier cron
// drift shifts delivery, never content (spec §4.4).
export const GET: APIRoute = async ({request}) => {
  const cronSecret = import.meta.env.CRON_SECRET
  if (!cronSecret) return new Response('Cron not configured', {status: 503})

  const authorization = request.headers.get('authorization') ?? ''
  if (!authorization.startsWith('Bearer ') || !safeCompare(authorization.slice(7), cronSecret)) {
    return new Response('Unauthorized', {status: 401})
  }

  const {GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY} = import.meta.env
  if (!GA4_PROPERTY_ID || !GA4_CLIENT_EMAIL || !GA4_PRIVATE_KEY) {
    Sentry.captureMessage('Traffic digest is not configured (GA4 env vars missing)', 'warning')
    return new Response('GA4 not configured', {status: 503})
  }

  try {
    const digest = await fetchTrafficDigest({
      propertyId: GA4_PROPERTY_ID,
      clientEmail: GA4_CLIENT_EMAIL,
      privateKey: GA4_PRIVATE_KEY,
    })
    await postActivity(renderDigest(digest))
  } catch (error) {
    // Never post a partial digest; the failure itself becomes a Sentry issue.
    Sentry.captureException(error)
    return new Response('Digest failed', {status: 500})
  }
  return new Response('ok')
}
