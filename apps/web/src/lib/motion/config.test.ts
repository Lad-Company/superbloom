import {afterEach, describe, expect, it, vi} from 'vitest'
import {isPreviewMode, prefersReducedMotion} from './config'

const stubDom = (preview: boolean, reducedMotion: boolean) => {
  vi.stubGlobal('document', {
    documentElement: {hasAttribute: (name: string) => name === 'data-preview' && preview},
  })
  vi.stubGlobal('window', {matchMedia: () => ({matches: reducedMotion})})
}

describe('preview mode motion gate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('treats data-preview on <html> as reduced motion', () => {
    stubDom(true, false)
    expect(isPreviewMode()).toBe(true)
    expect(prefersReducedMotion()).toBe(true)
  })

  it('follows the media query when the flag is absent', () => {
    stubDom(false, true)
    expect(isPreviewMode()).toBe(false)
    expect(prefersReducedMotion()).toBe(true)

    stubDom(false, false)
    expect(prefersReducedMotion()).toBe(false)
  })
})
