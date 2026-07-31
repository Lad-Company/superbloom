// @vitest-environment jsdom
import {beforeEach, describe, expect, it} from 'vitest'
import {CONSENT_KEY, readConsent, writeConsent} from './consent'

function stubLocalStorage() {
  const store = new Map<string, string>()
  const mock: Storage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => store.set(key, value),
  }
  Object.defineProperty(window, 'localStorage', {value: mock, configurable: true})
}

describe('consent storage', () => {
  beforeEach(() => {
    stubLocalStorage()
  })

  it('roundtrips a granted choice', () => {
    writeConsent('granted')
    expect(readConsent()).toBe('granted')
  })

  it('roundtrips a denied choice', () => {
    writeConsent('denied')
    expect(readConsent()).toBe('denied')
  })

  it('returns null when nothing is stored', () => {
    expect(readConsent()).toBeNull()
  })

  it('returns null for malformed json', () => {
    window.localStorage.setItem(CONSENT_KEY, '{not json')
    expect(readConsent()).toBeNull()
  })

  it('returns null when the stored version does not match', () => {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({status: 'granted', v: 999, ts: 0}))
    expect(readConsent()).toBeNull()
  })

  it('returns null for an unrecognized status', () => {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({status: 'maybe', v: 1, ts: 0}))
    expect(readConsent()).toBeNull()
  })
})
