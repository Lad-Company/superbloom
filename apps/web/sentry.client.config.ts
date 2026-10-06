import * as Sentry from '@sentry/astro'

// Values are inlined at build time via the Vite `define` entries in
// astro.config.mjs (client bundles can't read non-public env vars). The DSN is
// public by design; it ships in every Sentry-instrumented site's JS.
//
// Loading is deferred (GH #164): the @sentry/astro integration no longer
// injects this file as a page script (it sat on the first-paint critical
// path); `src/lib/sentryDeferred.ts` dynamic-imports it after `window load`
// and replays the Layout inline buffer's pre-init errors. Keep this file
// side-effect-only so that import is the whole init.
Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,
  release: import.meta.env.SENTRY_RELEASE || undefined,
  environment: import.meta.env.SENTRY_ENVIRONMENT,
  // Privacy: never attach user info or HTTP request bodies (spec §4.1).
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
  // Errors and releases only (spec §2.7); no performance tracing.
  tracesSampleRate: 0,
})
