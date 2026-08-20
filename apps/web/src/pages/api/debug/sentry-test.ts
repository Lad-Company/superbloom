import type {APIRoute} from 'astro'
import * as Sentry from '@sentry/astro'
import {safeCompare} from '../../../lib/hookSecurity'

// Permanent Sentry smoke-test hook. Gated by CRON_SECRET as a query param so
// it can be triggered from a browser; 404s otherwise so it stays invisible.
// Hitting it raises a deliberately tagged error through the same server-side
// Sentry pipeline as any other API route failure.
//
//   GET /api/debug/sentry-test?secret=$CRON_SECRET
export const GET: APIRoute = async ({request}) => {
  const cronSecret = import.meta.env.CRON_SECRET
  const secret = new URL(request.url).searchParams.get('secret') ?? ''
  if (!cronSecret || !safeCompare(secret, cronSecret)) {
    return new Response('Not found', {status: 404})
  }

  const eventId = Sentry.captureException(new Error('Sentry smoke test (server)'), {
    tags: {smokeTest: 'server'},
  })
  // Serverless functions freeze after the response; flush so the event lands.
  await Sentry.flush(2000)
  return Response.json({ok: true, eventId})
}
