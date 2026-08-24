import {describe, expect, it} from 'vitest'
import {setContentCache, setPublicCache} from './cacheHeaders'

describe('setContentCache', () => {
  it('never stores preview responses', () => {
    const res = {headers: new Headers()}
    setContentCache(res, true)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('keeps published responses out of shared caches', () => {
    const res = {headers: new Headers()}
    setContentCache(res, false)
    expect(res.headers.get('Cache-Control')).toBe('private, no-cache')
  })

  // Regression: content HTML must never be shared-cached in either mode.
  // Vercel's edge cache keys by URL, not cookie, so any s-maxage'd published
  // page hijacks sb_preview requests — the Presentation pane then times out
  // ("Unable to connect") and share links show published content with no
  // preview bar.
  it('emits no shared-cache directives for content HTML', () => {
    for (const preview of [true, false]) {
      const res = {headers: new Headers()}
      setContentCache(res, preview)
      const header = res.headers.get('Cache-Control') ?? ''
      expect(header).not.toMatch(/s-maxage|stale-while-revalidate|public/)
    }
  })
})

describe('setPublicCache', () => {
  it('stays available for cookie-independent endpoints', () => {
    const res = {headers: new Headers()}
    setPublicCache(res, 3600)
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400',
    )
  })
})
