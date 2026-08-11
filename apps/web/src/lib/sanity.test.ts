import {afterEach, describe, expect, it, vi} from 'vitest'
import {getSanityClient, sanityClient} from './sanity'

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
