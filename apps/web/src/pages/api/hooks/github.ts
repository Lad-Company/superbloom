import type {APIRoute} from 'astro'
import * as Sentry from '@sentry/astro'
import {postAlert, postActivity} from '../../../lib/discord'
import {verifyGitHubSignature} from '../../../lib/hookSecurity'
import {renderDeployEvent} from '../../../lib/deployMessage'

// Receives GitHub `deployment_status` events for the repo (Vercel's GitHub app
// emits one per build) and drains production outcomes to Discord (spec §4.2).
export const POST: APIRoute = async ({request}) => {
  const secret = import.meta.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return new Response('GitHub hook not configured', {status: 503})

  const rawBody = await request.text()
  if (!verifyGitHubSignature(rawBody, request.headers.get('x-hub-signature-256'), secret)) {
    return new Response('Invalid signature', {status: 401})
  }

  const event = request.headers.get('x-github-event')
  if (event === 'ping') return new Response('pong')
  if (event !== 'deployment_status') return new Response('Event ignored')

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', {status: 400})
  }

  // Null when the event is intentionally dropped (preview deploys, non-final
  // states) — still a 2xx, per the response contract in spec §5.
  const rendered = renderDeployEvent(payload)
  if (!rendered) return new Response('Event dropped')

  try {
    await (rendered.channel === 'alerts' ? postAlert(rendered.message) : postActivity(rendered.message))
  } catch (error) {
    // The pipeline reports its own breakage (spec §5).
    Sentry.captureException(error)
    return new Response('Discord post failed', {status: 502})
  }
  return new Response('ok')
}
