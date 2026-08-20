import type {APIContext} from 'astro'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@sentry/astro', () => ({captureException: vi.fn(() => 'event-123'), flush: vi.fn()}))

import * as Sentry from '@sentry/astro'
import {GET} from './sentry-test'

const request = (secret?: string) =>
  new Request(`https://superbloom.test/api/debug/sentry-test${secret ? `?secret=${secret}` : ''}`)

const call = (req: Request) => GET({request: req} as unknown as APIContext)

describe('sentry smoke-test route', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'cron-secret')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('404s without the secret', async () => {
    expect((await call(request())).status).toBe(404)
    expect((await call(request('wrong'))).status).toBe(404)
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('404s when CRON_SECRET is not configured', async () => {
    vi.stubEnv('CRON_SECRET', '')

    expect((await call(request('anything'))).status).toBe(404)
  })

  it('captures a tagged exception and flushes it with the right secret', async () => {
    const res = await call(request('cron-secret'))

    expect(res.status).toBe(200)
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: {smokeTest: 'server'},
    })
    expect(Sentry.flush).toHaveBeenCalled()
    await expect(res.json()).resolves.toEqual({ok: true, eventId: 'event-123'})
  })
})
