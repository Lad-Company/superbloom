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
  // A promise rejected with an Event instead of an Error (first seen as
  // SUPERBLOOM-WEB-4: third-party code on /work rejected with a CustomEvent)
  // arrives with no message and no stack — just "Event `CustomEvent` captured
  // as promise rejection". The rejection reason survives on the hint, so lift
  // its identifying fields into extra context: the event class and type, the
  // CustomEvent detail's shape, and the target element. Key names and scalars
  // only — detail values could carry payload data, and spec §4.1 keeps user
  // data out of Sentry.
  beforeSend(event, hint) {
    const reason = hint.originalException
    if (reason instanceof Event) {
      const target = reason.target
      event.extra = {
        ...event.extra,
        rejectionReason: {
          eventClass: reason.constructor.name,
          type: reason.type,
          detail:
            reason instanceof CustomEvent
              ? reason.detail !== null && typeof reason.detail === 'object'
                ? {keys: Object.keys(reason.detail)}
                : String(reason.detail)
              : undefined,
          target:
            target instanceof Element
              ? target.tagName.toLowerCase() + (target.id ? `#${target.id}` : '')
              : undefined,
        },
      }
    }
    return event
  },
})
