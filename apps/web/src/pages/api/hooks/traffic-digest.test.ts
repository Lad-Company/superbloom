import type {APIContext} from 'astro'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@sentry/astro', () => ({captureException: vi.fn(), captureMessage: vi.fn()}))
vi.mock('../../../lib/discord', () => ({postActivity: vi.fn()}))
vi.mock('../../../lib/ga4', () => ({
  fetchTrafficDigest: vi.fn(),
  renderDigest: vi.fn(() => 'Traffic — Mon Aug 17: 312 users · 401 sessions · Top: / (98)'),
}))

import * as Sentry from '@sentry/astro'
import {postActivity} from '../../../lib/discord'
import {fetchTrafficDigest} from '../../../lib/ga4'
import {GET} from './traffic-digest'

const request = (token?: string) =>
  new Request('https://superbloom.test/api/hooks/traffic-digest', {
    headers: token ? {authorization: `Bearer ${token}`} : {},
  })

const call = (req: Request) => GET({request: req} as unknown as APIContext)

describe('traffic digest cron route', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'cron-secret')
    vi.stubEnv('GA4_PROPERTY_ID', '123456789')
    vi.stubEnv('GA4_CLIENT_EMAIL', 'ga4-digest@project.iam.gserviceaccount.com')
    vi.stubEnv('GA4_PRIVATE_KEY', 'pem-contents')
    vi.mocked(fetchTrafficDigest).mockResolvedValue({
      dateLabel: 'Mon Aug 17',
      users: '312',
      sessions: '401',
      topPages: [['/', '98']],
      topReferrers: [['direct', '96']],
    })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('rejects calls without the cron bearer token', async () => {
    expect((await call(request())).status).toBe(401)
    expect((await call(request('wrong'))).status).toBe(401)
    expect(fetchTrafficDigest).not.toHaveBeenCalled()
  })

  it('is unavailable when CRON_SECRET is not configured', async () => {
    vi.stubEnv('CRON_SECRET', '')

    expect((await call(request('cron-secret'))).status).toBe(503)
  })

  it('posts the digest to the activity channel', async () => {
    const res = await call(request('cron-secret'))

    expect(res.status).toBe(200)
    expect(fetchTrafficDigest).toHaveBeenCalledWith({
      propertyId: '123456789',
      clientEmail: 'ga4-digest@project.iam.gserviceaccount.com',
      privateKey: 'pem-contents',
    })
    expect(postActivity).toHaveBeenCalledWith(
      'Traffic — Mon Aug 17: 312 users · 401 sessions · Top: / (98)',
    )
  })

  it('reports to Sentry instead of posting when the GA4 query fails', async () => {
    vi.mocked(fetchTrafficDigest).mockRejectedValueOnce(new Error('ga4 down'))

    const res = await call(request('cron-secret'))

    expect(res.status).toBe(500)
    expect(Sentry.captureException).toHaveBeenCalled()
    expect(postActivity).not.toHaveBeenCalled()
  })

  it('reports misconfiguration to Sentry when GA4 env vars are missing', async () => {
    vi.stubEnv('GA4_PROPERTY_ID', '')

    const res = await call(request('cron-secret'))

    expect(res.status).toBe(503)
    expect(Sentry.captureMessage).toHaveBeenCalledWith(expect.stringContaining('GA4'), 'warning')
    expect(postActivity).not.toHaveBeenCalled()
  })
})
