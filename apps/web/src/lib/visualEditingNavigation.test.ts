import {describe, expect, it} from 'vitest'
import {resolveToolNavigation} from './visualEditingNavigation'

const ORIGIN = 'https://superbloom-theta.vercel.app'

describe('resolveToolNavigation', () => {
  it('maps a relative push update to a ClientRouter navigation', () => {
    expect(resolveToolNavigation({type: 'push', url: '/work?x=1#y'}, ORIGIN)).toEqual({
      kind: 'navigate',
      url: '/work?x=1#y',
      replace: false,
    })
  })

  it('maps replace updates to a history-replacing navigation', () => {
    expect(resolveToolNavigation({type: 'replace', url: '/zine'}, ORIGIN)).toEqual({
      kind: 'navigate',
      url: '/zine',
      replace: true,
    })
  })

  it('maps pop updates to history.back', () => {
    expect(resolveToolNavigation({type: 'pop', url: '/'}, ORIGIN)).toEqual({kind: 'back'})
  })

  it('accepts same-origin absolute URLs and strips the origin', () => {
    expect(resolveToolNavigation({type: 'push', url: `${ORIGIN}/who-we-are`}, ORIGIN)).toEqual({
      kind: 'navigate',
      url: '/who-we-are',
      replace: false,
    })
  })

  it('refuses cross-origin URLs', () => {
    expect(resolveToolNavigation({type: 'push', url: 'https://evil.example/'}, ORIGIN)).toBeNull()
  })

  it('refuses unparseable URLs', () => {
    expect(resolveToolNavigation({type: 'push', url: 'http://[bad'}, ORIGIN)).toBeNull()
  })
})
