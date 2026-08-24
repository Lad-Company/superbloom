import {describe, expect, it} from 'vitest'
import {
  isPreviewRequest,
  isPreviewInactiveRequest,
  hasPreviewParam,
  PREVIEW_COOKIE,
  PREVIEW_INACTIVE_COOKIE,
  PREVIEW_PERSPECTIVE_PARAM,
} from './preview'

const cookiesWith = (value?: string) => ({
  get: (name: string) => (name === PREVIEW_COOKIE && value ? {value} : undefined),
})

const cookiesWithMarker = (preview?: string, inactive?: string) => ({
  get: (name: string) => {
    if (name === PREVIEW_COOKIE && preview) return {value: preview}
    if (name === PREVIEW_INACTIVE_COOKIE && inactive) return {value: inactive}
    return undefined
  },
})

const urlWith = (search = '') => new URL(`http://localhost:4321/work${search}`)

describe('isPreviewRequest', () => {
  it('is true when the preview cookie carries a value', () => {
    expect(isPreviewRequest(cookiesWith('true'))).toBe(true)
  })

  it('is false without the cookie or with an empty value', () => {
    expect(isPreviewRequest(cookiesWith(undefined))).toBe(false)
    expect(isPreviewRequest(cookiesWith(''))).toBe(false)
  })
})

describe('hasPreviewParam', () => {
  it('is true when the URL carries the perspective param', () => {
    expect(hasPreviewParam(urlWith(`?${PREVIEW_PERSPECTIVE_PARAM}=drafts`))).toBe(true)
  })

  it('is false on ordinary URLs', () => {
    expect(hasPreviewParam(urlWith())).toBe(false)
    expect(hasPreviewParam(urlWith('?sort=oldest'))).toBe(false)
  })
})

describe('isPreviewInactiveRequest', () => {
  it('is false during a live preview session', () => {
    const url = urlWith(`?${PREVIEW_PERSPECTIVE_PARAM}=drafts`)
    expect(isPreviewInactiveRequest(cookiesWithMarker('true'), url)).toBe(false)
  })

  it('is true when the param arrives without the cookie (Open preview popup, cookie lost)', () => {
    const url = urlWith(`?${PREVIEW_PERSPECTIVE_PARAM}=drafts`)
    expect(isPreviewInactiveRequest(cookiesWithMarker(), url)).toBe(true)
  })

  it('stays true on later param-less navigations via the marker cookie', () => {
    expect(isPreviewInactiveRequest(cookiesWithMarker(undefined, '1'), urlWith())).toBe(true)
  })

  it('is false for normal traffic', () => {
    expect(isPreviewInactiveRequest(cookiesWithMarker(), urlWith())).toBe(false)
  })
})
