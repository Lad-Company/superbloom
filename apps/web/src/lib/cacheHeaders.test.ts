import {describe, expect, it} from 'vitest'
import {setContentCache} from './cacheHeaders'

describe('setContentCache', () => {
  it('never edge-caches preview responses', () => {
    const res = {headers: new Headers()}
    setContentCache(res, true)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('keeps the public edge cache header for normal responses', () => {
    const res = {headers: new Headers()}
    setContentCache(res, false)
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=86400',
    )
  })
})
