import * as Sentry from '@sentry/astro'

// Same inlined values as the client config (see astro.config.mjs `define`).
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
