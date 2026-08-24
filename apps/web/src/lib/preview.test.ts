import {describe, expect, it} from 'vitest'
import {isPreviewRequest, PREVIEW_COOKIE} from './preview'

const cookiesWith = (value?: string) => ({
  get: (name: string) => (name === PREVIEW_COOKIE && value ? {value} : undefined),
})

describe('isPreviewRequest', () => {
  it('is true when the preview cookie carries a value', () => {
    expect(isPreviewRequest(cookiesWith('true'))).toBe(true)
  })

  it('is false without the cookie or with an empty value', () => {
    expect(isPreviewRequest(cookiesWith(undefined))).toBe(false)
    expect(isPreviewRequest(cookiesWith(''))).toBe(false)
  })
})
