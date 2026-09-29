import {afterEach, describe, expect, it, vi} from 'vitest'
import type {SanityClient} from '@sanity/client'
import {fetchSafe, getSanityClient, sanityClient} from './sanity'

vi.mock('@sentry/astro', () => ({captureException: vi.fn()}))
import * as Sentry from '@sentry/astro'

describe('getSanityClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the published CDN client by default', () => {
    const client = getSanityClient(false)
    expect(client).toBe(sanityClient)
    expect(client.config().useCdn).toBe(true)
    expect(client.config().token).toBeUndefined()
    expect(client.config().perspective).not.toBe('drafts')
  })

  it('returns a drafts, no-CDN, viewer-token client for preview requests', () => {
    vi.stubEnv('SANITY_API_READ_TOKEN', 'test-read-token')
    const config = getSanityClient(true).config()
    expect(config.useCdn).toBe(false)
    expect(config.perspective).toBe('drafts')
    expect(config.token).toBe('test-read-token')
  })
})

const clientWith = (fetchImpl: ReturnType<typeof vi.fn>) =>
  ({fetch: fetchImpl}) as unknown as SanityClient

describe('fetchSafe', () => {
  it('returns the query result on success', async () => {
    const client = clientWith(vi.fn().mockResolvedValue({title: 'Hi'}))
    await expect(fetchSafe(client, '*[]')).resolves.toEqual({title: 'Hi'})
  })

  it('passes null through so routes keep their 404 handling', async () => {
    const client = clientWith(vi.fn().mockResolvedValue(null))
    await expect(fetchSafe(client, '*[]')).resolves.toBeNull()
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('retries a transient failure once and succeeds', async () => {
    const client = clientWith(
      vi.fn().mockRejectedValueOnce(new Error('socket hangup')).mockResolvedValueOnce(['ok']),
    )
    await expect(fetchSafe(client, '*[]')).resolves.toEqual(['ok'])
    expect(client.fetch).toHaveBeenCalledTimes(2)
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('returns undefined and reports to Sentry after both attempts fail', async () => {
    const error = new Error('sanity down')
    const client = clientWith(vi.fn().mockRejectedValue(error))
    await expect(fetchSafe(client, '*[]')).resolves.toBeUndefined()
    expect(client.fetch).toHaveBeenCalledTimes(2)
    expect(Sentry.captureException).toHaveBeenCalledWith(error)
  })

  it('does not retry a 4xx — the query is wrong, not the service', async () => {
    const error = Object.assign(new Error('bad GROQ'), {statusCode: 400})
    const client = clientWith(vi.fn().mockRejectedValue(error))
    await expect(fetchSafe(client, '*[]')).resolves.toBeUndefined()
    expect(client.fetch).toHaveBeenCalledTimes(1)
    expect(Sentry.captureException).toHaveBeenCalledWith(error)
  })
})
