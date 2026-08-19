import type {APIContext} from 'astro'
import {createHmac} from 'node:crypto'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@sentry/astro', () => ({captureException: vi.fn()}))
vi.mock('../../../lib/discord', () => ({postActivity: vi.fn()}))
vi.mock('../../../lib/sanity', () => ({
  sanityClient: {
    withConfig: vi.fn(() => ({fetch: vi.fn().mockResolvedValue('issue-no-5')})),
  },
}))

import * as Sentry from '@sentry/astro'
import {postActivity} from '../../../lib/discord'
import {POST} from './sanity'

const SECRET = 'sanity-hook-secret'

// Independently computes the documented Stripe-style signature (HMAC-SHA256 of
// `${t}.${body}`, base64url, millisecond timestamp) to cross-check @sanity/webhook.
const sign = (body: string, t = Date.now()) =>
  `t=${t},v1=${createHmac('sha256', SECRET).update(`${t}.${body}`, 'utf8').digest('base64url')}`

let keyCounter = 0
const request = (body: object, headers: Record<string, string> = {}) => {
  const raw = JSON.stringify(body)
  return new Request('https://superbloom.test/api/hooks/sanity', {
    method: 'POST',
    headers: {
      'sanity-webhook-signature': sign(raw),
      'sanity-operation': 'create',
      'sanity-document-id': 'doc-1',
      'idempotency-key': `delivery-${++keyCounter}`,
      ...headers,
    },
    body: raw,
  })
}

const call = (req: Request) => POST({request: req} as unknown as APIContext)

describe('sanity publish hook', () => {
  beforeEach(() => {
    vi.stubEnv('SANITY_WEBHOOK_SECRET', SECRET)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('rejects a bad signature with 401 and posts nothing', async () => {
    const res = await call(
      request({_type: 'caseStudy', title: 'X'}, {'sanity-webhook-signature': 't=1,v1=bogus'}),
    )

    expect(res.status).toBe(401)
    expect(postActivity).not.toHaveBeenCalled()
  })

  it('posts a rendered publish to the activity channel', async () => {
    const res = await call(request({_type: 'caseStudy', title: 'Brand X Campaign', slug: 'brand-x'}))

    expect(res.status).toBe(200)
    expect(postActivity).toHaveBeenCalledWith(
      "New Case Study published — 'Brand X Campaign' · /work/brand-x",
    )
  })

  it('ignores repeat deliveries of the same idempotency key', async () => {
    const body = {_type: 'tag', title: 'Rooftops'}
    const first = await call(request(body, {'idempotency-key': 'same-delivery'}))
    const second = await call(request(body, {'idempotency-key': 'same-delivery'}))

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(await second.text()).toBe('Duplicate delivery')
    expect(postActivity).toHaveBeenCalledTimes(1)
  })

  it('drops types outside the allowlist', async () => {
    const res = await call(request({_type: 'formSubmission', title: 'secret PII'}))

    expect(res.status).toBe(200)
    expect(postActivity).not.toHaveBeenCalled()
  })

  it('resolves the issue path for zine articles', async () => {
    await call(
      request({_type: 'article', title: 'Story', slug: 'story', articleType: 'zine'}),
    )

    expect(postActivity).toHaveBeenCalledWith(
      "New Zine Article published — 'Story' · /zine/issues/issue-no-5/story",
    )
  })

  it('returns 502 and reports to Sentry when the Discord post fails', async () => {
    vi.mocked(postActivity).mockRejectedValueOnce(new Error('discord down'))

    const res = await call(request({_type: 'tag', title: 'Rooftops'}))

    expect(res.status).toBe(502)
    expect(Sentry.captureException).toHaveBeenCalled()
  })
})
