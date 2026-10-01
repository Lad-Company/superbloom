import type {APIContext} from 'astro'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const create = vi.fn().mockResolvedValue({_id: 'submission-1'})
const send = vi.fn().mockResolvedValue({id: 'email-1'})

vi.mock('@sanity/client', () => ({
  createClient: vi.fn(() => ({create})),
}))
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({emails: {send}})),
}))

import {POST} from './contact'

const request = (fields: Record<string, string> = {}) => {
  const body = new FormData()
  const data = {
    inquiryType: 'agency-partner',
    name: 'Test Person',
    email: 'person@example.com',
    hearAboutUs: 'referral',
    message: 'Hello there',
    website: '',
    startedAt: String(Date.now() - 2000),
    ...fields,
  }
  for (const [key, value] of Object.entries(data)) body.set(key, value)
  return new Request('https://superbloom.test/api/contact', {method: 'POST', body})
}

const call = (req: Request) => POST({request: req} as unknown as APIContext)

describe('contact form endpoint', () => {
  beforeEach(() => {
    vi.stubEnv('SANITY_API_TOKEN', 'sanity-token')
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('stores the submission in Sanity and emails the notification', async () => {
    const res = await call(request())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({success: true})
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: 'formSubmission',
        inquiryType: 'agency-partner',
        name: 'Test Person',
        email: 'person@example.com',
      }),
    )
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Superbloom Site <forms@superbloomhouse.com>',
        to: 'hello@superbloomhouse.com',
        replyTo: 'person@example.com',
        subject: 'New inquiry: Brand looking for an agency partner — Test Person',
      }),
    )
    const text = send.mock.calls[0][0].text as string
    expect(text).toContain('Inquiry type: Brand looking for an agency partner')
    expect(text).toContain('Heard about us: Referral')
    expect(text).toContain('Hello there')
  })

  it('still returns success when the email send fails', async () => {
    send.mockRejectedValueOnce(new Error('resend down'))

    const res = await call(request())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({success: true})
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('still returns success when RESEND_API_KEY is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '')

    const res = await call(request())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({success: true})
    expect(create).toHaveBeenCalledTimes(1)
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects spam and never reaches Sanity or Resend', async () => {
    const res = await call(request({website: 'https://spam.example'}))

    expect(res.status).toBe(400)
    expect(create).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })
})
