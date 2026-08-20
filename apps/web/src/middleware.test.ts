import type {APIContext} from 'astro'
import {afterEach, describe, expect, it, vi} from 'vitest'

vi.mock('@sentry/astro', () => ({init: vi.fn()}))

import * as Sentry from '@sentry/astro'

const load = async () => {
  vi.resetModules()
  return import('./middleware')
}

describe('middleware Sentry init', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('runs the server init when the build inlined Sentry as enabled', async () => {
    vi.stubEnv('SENTRY_ENABLED', 'true')
    vi.stubEnv('SENTRY_DSN', 'https://public@example.ingest.sentry.io/1')
    vi.stubEnv('SENTRY_RELEASE', '')
    vi.stubEnv('SENTRY_ENVIRONMENT', 'production')

    await load()

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({dsn: 'https://public@example.ingest.sentry.io/1'}),
    )
  })

  it('stays inert when Sentry is disabled and passes requests through', async () => {
    const {onRequest} = await load()
    const next = vi.fn(() => Promise.resolve(new Response('ok')))

    const res = await onRequest({} as unknown as APIContext, next)

    expect(next).toHaveBeenCalled()
    expect(await res?.text()).toBe('ok')
    expect(Sentry.init).not.toHaveBeenCalled()
  })
})
