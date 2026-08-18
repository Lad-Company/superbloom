import * as Sentry from '@sentry/astro'

// Values are inlined at build time via the Vite `define` entries in
// astro.config.mjs (client bundles can't read non-public env vars). The DSN is
// public by design; it ships in every Sentry-instrumented site's JS.
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
