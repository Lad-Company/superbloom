import type {MiddlewareHandler} from 'astro'

// Runs the Sentry server init for endpoint-only requests. The @sentry/astro
// integration injects sentry.server.config.ts into SSR page renders
// ('page-ssr') only, so a request that hits an API route without rendering a
// page would otherwise have no client and silently drop captured events (the
// SDK's middleware passes through when getClient() is empty). Gated by the
// same switch as the integration, inlined at build time.
if (import.meta.env.SENTRY_ENABLED === 'true') {
  await import('../sentry.server.config')
}

export const onRequest: MiddlewareHandler = (_ctx, next) => next()
