// Stale-chunk recovery (Sentry SUPERBLOOM-WEB-5 / -WEB-6). Vercel serves only
// the latest deployment's `_astro/*.<hash>.js` files, so a visitor holding
// HTML from the previous deploy (open tab, bfcache, prefetched document)
// 404s when deferred code later calls a lazy `import()` — the browser
// surfaces it as an unhandled rejection whose message differs per engine.
// The fix is a single hard reload: fresh HTML arrives with the current
// chunk hashes and the import succeeds.

/** Matches the chunk-load failure message each engine produces for a failed
 *  dynamic `import()`:
 *  - Chrome/Edge: "Failed to fetch dynamically imported module: <url>"
 *  - Firefox:     "error loading dynamically imported module: <url>"
 *  - Safari:      "Importing a module script failed." (via window.onerror) */
const CHUNK_LOAD_PATTERNS = [
  /Failed to fetch dynamically imported module/,
  /error loading dynamically imported module/,
  /Importing a module script failed/,
]

/** True when an `unhandledrejection` reason or `error` event payload is a
 *  stale-chunk import failure. Accepts Error objects and bare strings —
 *  browsers are inconsistent about which they deliver. */
export function isChunkLoadError(reason: unknown): boolean {
  const message =
    reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : null
  if (!message) return false
  return CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(message))
}

/** sessionStorage key marking that this tab already reloaded once for a
 *  chunk failure. */
const RELOAD_FLAG = 'sbh:chunk-reload'

/** Reloads the page once per tab session when a dynamic import fails on a
 *  stale chunk. The guard is the whole design: a genuinely broken deploy
 *  (chunk 404s even on fresh HTML) must not reload-loop, so the flag is set
 *  before reloading and never cleared — sessionStorage scope (per tab
 *  session) is the bound. When the guard has already tripped the error is
 *  left alone and flows on to the Sentry pipeline normally.
 *
 *  Listens to both `unhandledrejection` (Chrome/Firefox rejections from
 *  `import()`) and `error` (Safari reports module-script failures through
 *  window.onerror). Registered from Layout.astro's bundled script: all
 *  observed failures happen on the deferred-motion beat after window load,
 *  so end-of-parse registration is early enough, and bundling keeps the
 *  predicate importable by tests. */
export function installChunkErrorReload(): void {
  const recover = (reason: unknown) => {
    if (!isChunkLoadError(reason)) return
    try {
      if (sessionStorage.getItem(RELOAD_FLAG)) return
      sessionStorage.setItem(RELOAD_FLAG, '1')
    } catch {
      // sessionStorage can throw (private mode, disabled storage); treat a
      // storage failure as "flag already set" — never risk a reload loop.
      return
    }
    location.reload()
  }

  window.addEventListener('unhandledrejection', (event) => recover(event.reason))
  window.addEventListener('error', (event) => recover(event.error ?? event.message))
}
