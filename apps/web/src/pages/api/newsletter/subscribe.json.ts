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

async function subscriberHash(email: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email))
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
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
      return response(false, 'invalid', 400)
    }
  } catch {
    // Provider failures intentionally exclude submission data from logs.
  }

  return response(false, 'network', 502)
}
