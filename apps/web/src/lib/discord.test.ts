import {afterEach, describe, expect, it, vi} from 'vitest'
import {postActivity, postToDiscord} from './discord'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

const lastCallBody = () => JSON.parse(fetchMock.mock.calls[0][1].body as string)

describe('postToDiscord', () => {
  afterEach(() => {
    fetchMock.mockReset()
  })

  it('posts content with all mention parsing disabled', async () => {
    fetchMock.mockResolvedValue(new Response(null, {status: 204}))

    await postToDiscord('https://discord.test/hook', 'hello @channel')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://discord.test/hook')
    expect(init.method).toBe('POST')
    const body = lastCallBody()
    expect(body.content).toBe('hello @channel')
    expect(body.allowed_mentions).toEqual({parse: []})
  })

  it('truncates content beyond the 2000-character limit', async () => {
    fetchMock.mockResolvedValue(new Response(null, {status: 204}))

    await postToDiscord('https://discord.test/hook', 'x'.repeat(2500))

    const body = lastCallBody()
    expect(body.content).toHaveLength(2000)
    expect(body.content.endsWith('…')).toBe(true)
  })

  it('throws when Discord rejects the post', async () => {
    fetchMock.mockResolvedValue(new Response('rate limited', {status: 429}))

    await expect(postToDiscord('https://discord.test/hook', 'hi')).rejects.toThrow('429')
  })
})

describe('postActivity', () => {
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllEnvs()
  })

  it('fails loudly when the webhook URL is not configured', async () => {
    vi.stubEnv('DISCORD_ACTIVITY_WEBHOOK_URL', '')

    await expect(postActivity('hi')).rejects.toThrow('DISCORD_ACTIVITY_WEBHOOK_URL')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
