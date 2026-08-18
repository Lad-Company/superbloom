import type {APIContext} from 'astro'
import {createHmac} from 'node:crypto'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@sentry/astro', () => ({captureException: vi.fn()}))
vi.mock('../../../lib/discord', () => ({postAlert: vi.fn(), postActivity: vi.fn()}))

import * as Sentry from '@sentry/astro'
import {postAlert, postActivity} from '../../../lib/discord'
import {POST} from './github'

const SECRET = 'github-hook-secret'
const signatureFor = (body: string) =>
  `sha256=${createHmac('sha256', SECRET).update(body, 'utf8').digest('hex')}`

const deploymentStatus = ({
  state = 'success',
  environment = 'production',
}: {state?: string; environment?: string} = {}) =>
  JSON.stringify({
    deployment_status: {
      state,
      created_at: '2026-08-17T12:01:42Z',
      target_url: 'https://vercel.com/lad-company/superbloom/abc123',
      environment_url: 'https://superbloom-theta.vercel.app',
    },
    deployment: {
      sha: '138ad15deadbeefcafe',
      ref: 'main',
      environment,
      created_at: '2026-08-17T12:00:00Z',
    },
  })

const request = (body: string, headers: Record<string, string> = {}) =>
  new Request('https://superbloom.test/api/hooks/github', {
    method: 'POST',
    headers: {
      'x-github-event': 'deployment_status',
      'x-hub-signature-256': signatureFor(body),
      ...headers,
    },
    body,
  })

const call = (req: Request) => POST({request: req} as unknown as APIContext)

describe('github deploy hook', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_WEBHOOK_SECRET', SECRET)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('rejects a bad signature with 401 and posts nothing', async () => {
    const res = await call(request('{}', {'x-hub-signature-256': 'sha256=bogus'}))

    expect(res.status).toBe(401)
    expect(postActivity).not.toHaveBeenCalled()
    expect(postAlert).not.toHaveBeenCalled()
  })

  it('is unavailable when the webhook secret is not configured', async () => {
    vi.stubEnv('GITHUB_WEBHOOK_SECRET', '')

    const res = await call(request(deploymentStatus()))

    expect(res.status).toBe(503)
  })

  it('answers the webhook ping', async () => {
    const res = await call(request('{}', {'x-github-event': 'ping'}))

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('pong')
  })

  it('drops preview deployments without posting', async () => {
    const res = await call(request(deploymentStatus({environment: 'Preview'})))

    expect(res.status).toBe(200)
    expect(postActivity).not.toHaveBeenCalled()
    expect(postAlert).not.toHaveBeenCalled()
  })

  it('posts production successes to the activity channel', async () => {
    const res = await call(request(deploymentStatus()))

    expect(res.status).toBe(200)
    expect(postActivity).toHaveBeenCalledWith(
      'Deploy succeeded — superbloom-theta.vercel.app · `main@138ad15` · 1m 42s',
    )
    expect(postAlert).not.toHaveBeenCalled()
  })

  it('posts production failures to the alerts channel', async () => {
    await call(request(deploymentStatus({state: 'failure'})))

    expect(postAlert).toHaveBeenCalledWith(expect.stringContaining('Deploy FAILED'))
    expect(postActivity).not.toHaveBeenCalled()
  })

  it('returns 502 and reports to Sentry when the Discord post fails', async () => {
    vi.mocked(postActivity).mockRejectedValueOnce(new Error('discord down'))

    const res = await call(request(deploymentStatus()))

    expect(res.status).toBe(502)
    expect(Sentry.captureException).toHaveBeenCalled()
  })
})
