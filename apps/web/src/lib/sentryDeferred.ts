// Deferred Sentry browser init (GH #164). The @sentry/astro integration's
// injected page script put the 51 KB SDK at the top of every <head> — High
// priority, on the first-paint critical path of an errors-only
// configuration. The integration now runs server-only (astro.config.mjs
// `enabled: {client: false, ...}`); this module loads the SDK after
// `window load` instead, so no Sentry bytes are fetched or executed before
// first paint. Errors thrown earlier are captured by the tiny inline buffer
// in Layout.astro and flushed below with their original stack, message, and
// timestamp. Acceptable loss (per the issue): console/click breadcrumbs
// from before the SDK loads.

/** One buffered pre-init error; mirrors the shape the Layout inline script
 *  pushes onto `window.__sbhSentryQueue`. */
export interface BufferedError {
  kind: 'error' | 'unhandledrejection'
  /** The Error/reason object, when the event carried one (null for
   *  cross-origin script errors and some string rejections). */
  error: unknown
  message: string
  /** Seconds since epoch (Sentry Event.timestamp units). */
  timestamp: number
}

declare global {
  interface Window {
    __sbhSentryQueue?: BufferedError[]
    /** Set once the SDK's own handlers are live; the buffer stops queueing. */
    __sbhSentryLive?: true
  }
}

type SentryModule = typeof import('@sentry/astro')

/** Schedules the SDK load. Safe to call on every page; a static no-op when
 *  Sentry is disabled (the define below folds to `'false' !== 'true'`, which
 *  Rollup dead-code-eliminates — preview/dev bundles emit no Sentry chunk at
 *  all). Bundled scripts run once per session across View Transitions, so
 *  the load listener is registered exactly once. */
export function initDeferredSentry(): void {
  if (import.meta.env.SENTRY_ENABLED !== 'true') return
  if (document.readyState === 'complete') {
    void loadAndFlush()
  } else {
    window.addEventListener('load', () => void loadAndFlush(), {once: true})
  }
}

async function loadAndFlush(): Promise<void> {
  const Sentry = await import('@sentry/astro')
  // Side effect: Sentry.init with the shared options (DSN, release,
  // environment, dataCollection, tracesSampleRate) — the same config the
  // integration used to inject, kept as the single source of truth.
  await import('../../sentry.client.config')
  // From here the SDK's own error handlers are live; stop the inline buffer
  // before draining so nothing is double-reported.
  window.__sbhSentryLive = true
  const queue = window.__sbhSentryQueue ?? []
  window.__sbhSentryQueue = []
  for (const entry of queue) {
    await forwardBuffered(Sentry, entry)
  }
}

/** Replays one pre-init error into the live SDK. The event is built through
 *  the client's own exception parser — identical stack/message handling to a
 *  live capture — then stamped with the time the error actually happened. */
export async function forwardBuffered(
  Sentry: SentryModule,
  entry: BufferedError,
): Promise<void> {
  const exception =
    entry.error instanceof Error
      ? entry.error
      : (entry.error ?? new Error(entry.message))
  const client = Sentry.getClient()
  if (!client) {
    // init didn't produce a client (e.g. empty DSN) — capture nothing rather
    // than throw inside an error handler.
    return
  }
  try {
    const event = await client.eventFromException(exception, {
      originalException: exception,
      mechanism: {handled: false},
    })
    event.timestamp = entry.timestamp
    client.captureEvent(event, {originalException: exception})
  } catch {
    // A parsing hiccup must not swallow the error: fall back to a plain
    // capture (timestamp becomes flush time, stack still intact).
    Sentry.captureException(exception)
  }
}
