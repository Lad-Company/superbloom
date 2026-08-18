import type {APIRoute} from 'astro'
import * as Sentry from '@sentry/astro'
import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'
import {postActivity} from '../../../lib/discord'
import {
  createIdempotencyCache,
  fetchZineIssueSlug,
  renderPublishMessage,
} from '../../../lib/publishMessage'

// Receives the Sanity publish webhook (GROQ-filtered to the allowlisted types)
// and drains publish/update/unpublish notifications to #site-activity (spec §4.3).

// Module scope: shared across invocations of a warm function instance.
const isDuplicate = createIdempotencyCache()

export const POST: APIRoute = async ({request}) => {
  const secret = import.meta.env.SANITY_WEBHOOK_SECRET
  if (!secret) return new Response('Sanity hook not configured', {status: 503})

  const rawBody = await request.text()
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? ''
  if (!(await isValidSignature(rawBody, signature, secret))) {
    return new Response('Invalid signature', {status: 401})
  }

  const idempotencyKey = request.headers.get('idempotency-key')
  if (idempotencyKey && isDuplicate(idempotencyKey)) {
    return new Response('Duplicate delivery')
  }

  let payload: {_type?: string; title?: string; slug?: string; articleType?: string}
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', {status: 400})
  }

  const operation = request.headers.get('sanity-operation') ?? 'update'

  // Zine articles don't know their issue (membership lives on
  // zineIssue.articles) and webhook projections can't sub-query, so the relay
  // resolves it here. Deletes skip the lookup: the message carries no link.
  let issueSlug: string | null = null
  if (payload._type === 'article' && payload.articleType === 'zine' && operation !== 'delete') {
    const documentId = request.headers.get('sanity-document-id')
    if (documentId) {
      try {
        issueSlug = await fetchZineIssueSlug(documentId)
      } catch (error) {
        // Fall back to linking /zine rather than dropping the notification.
        Sentry.captureException(error)
      }
    }
  }

  const message = renderPublishMessage({
    _type: payload._type ?? '',
    operation,
    title: payload.title,
    slug: payload.slug,
    articleType: payload.articleType,
    issueSlug,
  })
  if (!message) return new Response('Event dropped')

  try {
    await postActivity(message)
  } catch (error) {
    // The pipeline reports its own breakage (spec §5).
    Sentry.captureException(error)
    return new Response('Discord post failed', {status: 502})
  }
  return new Response('ok')
}
