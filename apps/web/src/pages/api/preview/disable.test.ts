import type {APIContext} from 'astro'
import {describe, expect, it, vi} from 'vitest'
import {GET} from './disable'
import {PREVIEW_COOKIE} from '../../../lib/preview'

const context = (referer?: string) => ({
  cookies: {delete: vi.fn()},
  request: new Request('http://localhost:4321/api/preview/disable', {
    headers: referer ? {referer} : {},
  }),
  redirect: (path: string, status?: number) =>
    new Response(null, {status: status ?? 302, headers: {location: path}}),
})

const callDisable = (ctx: ReturnType<typeof context>) => GET(ctx as unknown as APIContext)

describe('preview disable route', () => {
  it('clears the cookie and falls back to / without a referer', async () => {
    const ctx = context()
    const res = await callDisable(ctx)

    expect(ctx.cookies.delete).toHaveBeenCalledWith(PREVIEW_COOKIE, {path: '/'})
    expect(res.headers.get('location')).toBe('/')
  })

  it('returns to the same-origin referer path', async () => {
    const ctx = context('http://localhost:4321/work?sort=oldest')
    const res = await callDisable(ctx)

    expect(res.headers.get('location')).toBe('/work?sort=oldest')
  })

  it('never redirects to a cross-origin referer', async () => {
    const ctx = context('https://evil.example.com/work')
    const res = await callDisable(ctx)

    expect(res.headers.get('location')).toBe('/')
  })
})
