import {afterEach, describe, expect, it, vi} from 'vitest'
import {prefersReducedMotion} from './config'

const stubDom = (preview: boolean, reducedMotion: boolean) => {
  vi.stubGlobal('document', {
    documentElement: {hasAttribute: (name: string) => name === 'data-preview' && preview},
  })
  vi.stubGlobal('window', {matchMedia: () => ({matches: reducedMotion})})
}

describe('reduced motion gate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not treat data-preview on <html> as reduced motion', () => {
    // Draft preview used to quiet the whole motion system, which silently
    // disabled pinned sections for anyone holding the sb_preview cookie.
    // Motion now follows the visitor's own preference only.
    stubDom(true, false)
    expect(prefersReducedMotion()).toBe(false)
  })

  it('follows the media query', () => {
    stubDom(false, true)
    expect(prefersReducedMotion()).toBe(true)

    stubDom(false, false)
    expect(prefersReducedMotion()).toBe(false)
  })
})
