import type {APIContext} from 'astro'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const send = vi.fn().mockResolvedValue({id: 'email-1'})
const fetchMock = vi.fn()

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({emails: {send}})),
}))

import {POST} from './subscribe.json'
import welcomeTemplate from '../../../../emails/newsletter-welcome.html?raw'

const unsubscribeUrl = 'https://superbloomhouse.us1.list-manage.com/unsubscribe?u=abc&id=def'

const mailchimpResponse = (ok: boolean, status: number, body: unknown = {}) =>
  ({ok, status, json: vi.fn().mockResolvedValue(body)}) as unknown as Response

const request = (fields: Record<string, string> = {}) => {
  const body = new FormData()
  const data = {
    email: 'person@example.com',
    website: '',
    startedAt: String(Date.now() - 2000),
    ...fields,
  }
  for (const [key, value] of Object.entries(data)) body.set(key, value)
  return new Request('https://superbloom.test/api/newsletter/subscribe.json', {
    method: 'POST',
    body,
  })
}

const call = (req: Request) => POST({request: req} as unknown as APIContext)

// New subscriber: member lookup 404s, then the PUT upsert succeeds.
const subscribeSuccess = () => {
  fetchMock
    .mockResolvedValueOnce(mailchimpResponse(false, 404))
    .mockResolvedValueOnce(mailchimpResponse(true, 200))
}

describe('welcome email template', () => {
  it('carries the unsubscribe URL token', () => {
    // Guards the send-time invariant: without the token, replaceAll would
    // silently send a welcome email with no unsubscribe link.
    expect(welcomeTemplate).toContain('{{UNSUBSCRIBE_URL}}')
  })
})

describe('newsletter subscribe endpoint', () => {
  beforeEach(() => {
    vi.stubEnv('MAILCHIMP_KEY', 'test-key-us1')
    vi.stubEnv('MAILCHIMP_AUDIENCE_ID', 'audience-1')
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.stubEnv('MAILCHIMP_UNSUBSCRIBE_URL', unsubscribeUrl)
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('subscribes via Mailchimp and sends the welcome email', async () => {
    subscribeSuccess()

    const res = await call(request())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({success: true})
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({method: 'PUT'}))
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'The Microdose <microdose@updates.superbloomhouse.com>',
        to: 'person@example.com',
        subject: 'Welcome to The Microdose',
        headers: {'List-Unsubscribe': `<${unsubscribeUrl}>`},
      }),
    )
    const html = send.mock.calls[0][0].html as string
    expect(html).toContain(unsubscribeUrl)
    expect(html).not.toContain('{{UNSUBSCRIBE_URL}}')
  })

  it('returns duplicate and sends nothing for an existing subscriber', async () => {
    fetchMock.mockResolvedValueOnce(mailchimpResponse(true, 200, {status: 'subscribed'}))

    const res = await call(request())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({success: false, error: 'duplicate'})
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(send).not.toHaveBeenCalled()
  })

  it('still returns success when the welcome email send fails', async () => {
    subscribeSuccess()
    send.mockRejectedValueOnce(new Error('resend down'))

    const res = await call(request())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({success: true})
  })

  it('still returns success without sending when RESEND_API_KEY is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    subscribeSuccess()

    const res = await call(request())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({success: true})
    expect(send).not.toHaveBeenCalled()
  })

  it('still returns success without sending when MAILCHIMP_UNSUBSCRIBE_URL is not configured', async () => {
    vi.stubEnv('MAILCHIMP_UNSUBSCRIBE_URL', '')
    subscribeSuccess()

    const res = await call(request())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({success: true})
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects spam and never reaches Mailchimp or Resend', async () => {
    const res = await call(request({website: 'https://spam.example'}))

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })
})
