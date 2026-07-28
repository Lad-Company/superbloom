import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {clearCartId, readCartId, writeCartId} from './shopify-cart'

interface StoredCookie {
  value: string
  options?: Record<string, unknown>
}

function fakeCookies() {
  const jar = new Map<string, StoredCookie>()
  return {
    jar,
    get: (name: string) => jar.get(name),
    set: (name: string, value: string, options?: Record<string, unknown>) =>
      jar.set(name, {value, options}),
    delete: (name: string) => jar.delete(name),
  } as unknown as import('astro').AstroCookies & {jar: Map<string, StoredCookie>}
}

const CART_ID = 'gid://shopify/Cart/abc123?key=xyz'

describe('shopify cart cookie', () => {
  beforeEach(() => {
    vi.stubEnv('SHOPIFY_CART_COOKIE_SECRET', 'test-secret')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('roundtrips the cart id through write/read', () => {
    const cookies = fakeCookies()
    writeCartId(cookies, CART_ID)
    expect(readCartId(cookies)).toBe(CART_ID)
  })

  it('does not set the Secure flag outside production so http localhost persists it', () => {
    vi.stubEnv('PROD', false)
    const cookies = fakeCookies()
    writeCartId(cookies, CART_ID)
    expect(cookies.jar.get('superbloom_shop_cart')?.options?.secure).toBe(false)
  })

  it('sets the Secure flag in production', () => {
    vi.stubEnv('PROD', true)
    const cookies = fakeCookies()
    writeCartId(cookies, CART_ID)
    expect(cookies.jar.get('superbloom_shop_cart')?.options?.secure).toBe(true)
  })

  it('clears returns null after delete', () => {
    const cookies = fakeCookies()
    writeCartId(cookies, CART_ID)
    clearCartId(cookies)
    expect(readCartId(cookies)).toBeNull()
  })
})
