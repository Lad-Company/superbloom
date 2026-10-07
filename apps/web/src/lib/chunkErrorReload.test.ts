// @vitest-environment jsdom
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {installChunkErrorReload, isChunkLoadError} from './chunkErrorReload'

/* The installer adds window listeners, so each test re-registers against a
   fresh module-level-free surface: jsdom window persists per file, but the
   listeners are idempotent for these assertions (reload is stubbed). */

const CHROME_MSG =
  'Failed to fetch dynamically imported module: https://www.superbloomhouse.com/_astro/base.ChSXP9Rq.js'
const FIREFOX_MSG =
  'error loading dynamically imported module: https://www.superbloomhouse.com/_astro/depthLayer.CWAPiPgr.js'
const SAFARI_MSG = 'Importing a module script failed.'

const reload = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  // jsdom's location.reload throws "Not implemented"; stub it.
  Object.defineProperty(window, 'location', {
    value: {...window.location, reload},
    configurable: true,
    writable: true,
  })
})

describe('isChunkLoadError', () => {
  it('matches the Chrome message', () => {
    expect(isChunkLoadError(new TypeError(CHROME_MSG))).toBe(true)
  })

  it('matches the Firefox message', () => {
    expect(isChunkLoadError(new TypeError(FIREFOX_MSG))).toBe(true)
  })

  it('matches the Safari message', () => {
    expect(isChunkLoadError(new Error(SAFARI_MSG))).toBe(true)
  })

  it('matches bare string reasons', () => {
    expect(isChunkLoadError(CHROME_MSG)).toBe(true)
  })

  it('rejects unrelated errors and non-error reasons', () => {
    expect(isChunkLoadError(new TypeError('undefined is not a function'))).toBe(false)
    expect(isChunkLoadError(new Error('fetch failed'))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
    expect(isChunkLoadError(42)).toBe(false)
    expect(isChunkLoadError({message: CHROME_MSG})).toBe(false)
  })
})

describe('installChunkErrorReload', () => {
  installChunkErrorReload()

  const reject = (reason: unknown) => {
    // PromiseRejectionEvent isn't in jsdom; a plain Event with a reason
    // property matches the shape the handler reads.
    const event = new Event('unhandledrejection') as PromiseRejectionEvent
    Object.defineProperty(event, 'reason', {value: reason})
    window.dispatchEvent(event)
  }

  it('reloads once on a chunk-load rejection and sets the guard', () => {
    reject(new TypeError(CHROME_MSG))
    expect(reload).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('sbh:chunk-reload')).toBe('1')
  })

  it('does not reload again once the guard is set', () => {
    sessionStorage.setItem('sbh:chunk-reload', '1')
    reject(new TypeError(FIREFOX_MSG))
    expect(reload).not.toHaveBeenCalled()
  })

  it('ignores non-chunk rejections', () => {
    reject(new Error('something else broke'))
    expect(reload).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('sbh:chunk-reload')).toBeNull()
  })

  it('recovers from window.onerror-style events (Safari)', () => {
    const event = new ErrorEvent('error', {message: SAFARI_MSG})
    window.dispatchEvent(event)
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
