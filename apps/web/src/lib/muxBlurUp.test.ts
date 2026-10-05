import {beforeEach, describe, expect, it, vi} from 'vitest'
import {clearMuxBlurUpCache, muxBlurUpDataUri} from './muxBlurUp'

const okResponse = (bytes: Uint8Array, type = 'image/webp') =>
  new Response(bytes, {status: 200, headers: {'content-type': type}})

describe('muxBlurUpDataUri', () => {
  beforeEach(() => clearMuxBlurUpCache())

  it('inlines the 24px thumbnail as a data URI at the asset thumbTime', async () => {
    const fetchImpl = vi.fn(async () => okResponse(new Uint8Array([1, 2, 3])))
    const uri = await muxBlurUpDataUri('abc', 4, fetchImpl as unknown as typeof fetch)
    expect(uri).toBe('data:image/webp;base64,AQID')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      'https://image.mux.com/abc/thumbnail.webp?width=24&time=4',
    )
  })

  it('shares one request per asset across renders', async () => {
    const fetchImpl = vi.fn(async () => okResponse(new Uint8Array([9])))
    await Promise.all([
      muxBlurUpDataUri('abc', 0, fetchImpl as unknown as typeof fetch),
      muxBlurUpDataUri('abc', 0, fetchImpl as unknown as typeof fetch),
    ])
    await muxBlurUpDataUri('abc', 0, fetchImpl as unknown as typeof fetch)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('returns null on a non-OK response and retries on the next render', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, {status: 404}))
      .mockResolvedValueOnce(okResponse(new Uint8Array([7])))
    expect(await muxBlurUpDataUri('abc', 0, fetchImpl as unknown as typeof fetch)).toBeNull()
    expect(await muxBlurUpDataUri('abc', 0, fetchImpl as unknown as typeof fetch)).toBe(
      'data:image/webp;base64,Bw==',
    )
  })

  it('returns null when the fetch throws (network error, abort)', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('boom')
    })
    expect(await muxBlurUpDataUri('abc', 0, fetchImpl as unknown as typeof fetch)).toBeNull()
  })

  it('returns null for an empty body', async () => {
    const fetchImpl = vi.fn(async () => okResponse(new Uint8Array([])))
    expect(await muxBlurUpDataUri('abc', 0, fetchImpl as unknown as typeof fetch)).toBeNull()
  })
})
