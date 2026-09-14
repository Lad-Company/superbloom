import {createHash} from 'node:crypto'
import type {APIRoute} from 'astro'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const minimumFillTimeMs = 750
const maximumFillTimeMs = 86_400_000

type NewsletterError = 'duplicate' | 'invalid' | 'network'

function response(success: true): Response
function response(success: false, error: NewsletterError, status: number): Response
function response(success: boolean, error?: NewsletterError, status = 200) {
  return new Response(JSON.stringify(success ? {success} : {success, error}), {
    status,
    headers: {'Content-Type': 'application/json'},
  })
}

// Mailchimp keys list members by the MD5 hash of the lowercased email
// address; any other digest makes member lookups 404 and updates 400.
function subscriberHash(email: string) {
  return createHash('md5').update(email).digest('hex')
}

export const POST: APIRoute = async ({request}) => {
  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return response(false, 'invalid', 400)
  }

  const email = formData.get('email')?.toString().trim().toLowerCase() ?? ''
  const honeypot = formData.get('website')?.toString() ?? ''
  const startedAt = Number(formData.get('startedAt'))
  const elapsed = Date.now() - startedAt

  if (
    honeypot ||
    !Number.isFinite(startedAt) ||
    elapsed < minimumFillTimeMs ||
    elapsed > maximumFillTimeMs ||
    !emailPattern.test(email) ||
    email.length > 254
  ) {
    // Log the rejection reason (never the email) so real users blocked by
    // spam-trap false positives, e.g. autofill populating the honeypot, are
    // distinguishable from bots in the function logs.
    const reason = honeypot
      ? 'honeypot'
      : !Number.isFinite(startedAt)
        ? 'started-at-missing'
        : elapsed < minimumFillTimeMs
          ? 'fill-too-fast'
          : elapsed > maximumFillTimeMs
            ? 'fill-too-slow'
            : !emailPattern.test(email)
              ? 'email-format'
              : 'email-length'
    console.error('Newsletter signup rejected', {reason})
    return response(false, 'invalid', 400)
  }

  const apiKey = import.meta.env.MAILCHIMP_KEY
  const audienceId = import.meta.env.MAILCHIMP_AUDIENCE_ID
  const dataCenter = apiKey?.split('-').at(-1)

  if (!apiKey || !audienceId || !dataCenter) {
    console.error('Newsletter integration is not configured')
    return response(false, 'network', 503)
  }

  try {
    const hash = await subscriberHash(email)
    const memberUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${hash}`
    const authorization = `Basic ${Buffer.from(`mailchimp:${apiKey}`).toString('base64')}`
    const existingMember = await fetch(memberUrl, {
      headers: {Authorization: authorization},
      signal: AbortSignal.timeout(10_000),
    })

    if (existingMember.ok) {
      const member = (await existingMember.json()) as {status?: string}
      if (member.status === 'subscribed') {
        return response(false, 'duplicate', 200)
      }
    } else if (existingMember.status !== 404) {
      console.error('Mailchimp member lookup failed', {status: existingMember.status})
      return response(false, 'network', 502)
    }

    const mailchimpResponse = await fetch(
      memberUrl,
      {
        method: 'PUT',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email_address: email, status: 'subscribed', status_if_new: 'subscribed'}),
        signal: AbortSignal.timeout(10_000),
      },
    )

    if (mailchimpResponse.ok) {
      return response(true)
    }

    if (mailchimpResponse.status === 400) {
      // Surface Mailchimp's reason (fake-looking address, previously
      // unsubscribed, etc.) in the function logs with the email redacted;
      // the client still sees the generic 'invalid' response.
      const providerError = (await mailchimpResponse.json().catch(() => null)) as {
        title?: string
        detail?: string
      } | null
      console.error('Newsletter signup rejected by Mailchimp', {
        title: providerError?.title,
        detail: providerError?.detail?.replaceAll(email, '[redacted]'),
      })
      return response(false, 'invalid', 400)
    }

    console.error('Mailchimp subscribe request failed', {status: mailchimpResponse.status})
  } catch {
    // Provider failures intentionally exclude submission data from logs.
  }

  return response(false, 'network', 502)
}
