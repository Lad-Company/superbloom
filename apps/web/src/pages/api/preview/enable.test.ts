import type {APIContext} from 'astro'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {validatePreviewUrl} from '@sanity/preview-url-secret'
import {GET} from './enable'
import {PREVIEW_COOKIE} from '../../../lib/preview'

vi.mock('@sanity/preview-url-secret', () => ({validatePreviewUrl: vi.fn()}))

const mockedValidate = vi.mocked(validatePreviewUrl)

const context = () => ({
  cookies: {set: vi.fn()},
  url: new URL('http://localhost:4321/api/preview/enable?sanity-preview-secret=abc'),
  redirect: (path: string, status?: number) =>
    new Response(null, {status: status ?? 302, headers: {location: path}}),
})

const callEnable = (ctx: ReturnType<typeof context>) => GET(ctx as unknown as APIContext)

describe('preview enable route', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    mockedValidate.mockReset()
  })

  it('rejects a bad signature with 401 and sets no cookie', async () => {
    vi.stubEnv('SANITY_API_READ_TOKEN', 'test-read-token')
    mockedValidate.mockResolvedValue({isValid: false})

    const ctx = context()
    const res = await callEnable(ctx)

    expect(res.status).toBe(401)
    expect(ctx.cookies.set).not.toHaveBeenCalled()
  })

  it('sets a bounded-lifetime preview cookie and redirects to the target on a valid signature', async () => {
    vi.stubEnv('SANITY_API_READ_TOKEN', 'test-read-token')
    mockedValidate.mockResolvedValue({isValid: true, redirectTo: '/work'})

    const ctx = context()
    const res = await callEnable(ctx)

    expect(ctx.cookies.set).toHaveBeenCalledWith(
      PREVIEW_COOKIE,
      'true',
      expect.objectContaining({httpOnly: true, secure: true, sameSite: 'none', path: '/'}),
    )
    // Bounded to one workday: a bare session cookie survives browser restarts
    // under Chrome's session restore, silently stranding editors in draft mode.
    const options = ctx.cookies.set.mock.calls[0][2] as Record<string, unknown>
    expect(options).toHaveProperty('maxAge', 60 * 60 * 8)
    expect(options).not.toHaveProperty('expires')

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/work')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('is unavailable when the read token is not configured', async () => {
    vi.stubEnv('SANITY_API_READ_TOKEN', '')

    const ctx = context()
    const res = await callEnable(ctx)

    expect(res.status).toBe(503)
    expect(mockedValidate).not.toHaveBeenCalled()
    expect(ctx.cookies.set).not.toHaveBeenCalled()
  })
})
