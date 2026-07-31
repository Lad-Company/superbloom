export const CONSENT_KEY = 'sbh_consent'
export const CONSENT_VERSION = 1

export type ConsentStatus = 'granted' | 'denied'

interface StoredConsent {
  status: ConsentStatus
  v: number
  ts: number
}

// Returns null when there is no valid stored choice, so a missing, malformed, or
// version-bumped record re-prompts the visitor.
export function readConsent(): ConsentStatus | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredConsent | null
    if (!parsed || parsed.v !== CONSENT_VERSION) return null
    if (parsed.status !== 'granted' && parsed.status !== 'denied') return null
    return parsed.status
  } catch {
    return null
  }
}

export function writeConsent(status: ConsentStatus): void {
  try {
    const value: StoredConsent = {status, v: CONSENT_VERSION, ts: Date.now()}
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value))
  } catch {
    // Storage unavailable (private mode / disabled) — consent simply won't persist.
  }
}
