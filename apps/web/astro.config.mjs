// @ts-check
import {defineConfig} from 'astro/config'
import vercel from '@astrojs/vercel'
import UnoCSS from '@unocss/astro'
import sentry from '@sentry/astro'
import {loadEnv} from 'vite'

// Env lives at the repo root (vite.envDir '../..'); loadEnv exposes it to this
// config file both locally (.env.local) and on Vercel (process.env).
const env = loadEnv(process.env.NODE_ENV ?? 'development', '../..', '')

const onVercel = Boolean(env.VERCEL)
// Errors are reported from production only: preview deploys and local dev stay
// out of Sentry (mirrors the gaMode preview exclusion, ADR-0026). Set
// SENTRY_FORCE_ENABLE=1 to override — e.g. to smoke-test from a preview deploy
// or a local dev server (env vars load from the repo-root .env.local too).
const sentryEnabled =
  Boolean(env.SENTRY_DSN) &&
  (env.SENTRY_FORCE_ENABLE === '1' ||
    (onVercel ? env.VERCEL_ENV === 'production' : process.env.NODE_ENV === 'production'))
// Source maps upload only from Vercel production builds, never local ones.
const sentryAuthToken =
  onVercel && env.VERCEL_ENV === 'production' ? env.SENTRY_AUTH_TOKEN : undefined

// https://astro.build/config
export default defineConfig({
  // www is canonical: the apex 308-redirects to it at the Vercel edge.
  site: 'https://www.superbloomhouse.com',
  output: 'server',
  adapter: vercel(),
  redirects: {
    // /edit is the human-memorable door into the CMS.
    '/edit': 'https://superbloom-cms.sanity.studio',
  },
  build: {
    // Inline every page stylesheet into the served HTML. Each page ships 3–5
    // small stylesheets (≈10KB total — __uno, PageHero, Footer, page CSS), so
    // the default 'auto' (inline only below the 4KB assetsInlineLimit) left
    // several render-blocking requests; inlining trades <12KB of HTML for one
    // fewer round trip on first paint (Lighthouse render-blocking-insight).
    inlineStylesheets: 'always',
  },
  integrations: [
    UnoCSS(),
    sentry({
      enabled: sentryEnabled,
      org: env.SENTRY_ORG,
      project: env.SENTRY_PROJECT,
      authToken: sentryAuthToken,
      telemetry: false,
      sourcemaps: {
        // Disable the integration's auto-set filesToDeleteAfterUpload
        // (['./dist/**/client/**/*.map', './dist/**/server/**/*.map']). It
        // deletes the server maps after the SSR pass uploads them, so the
        // client pass's upload re-scans dist, finds the server scripts
        // mapless, and re-uploads them with ~120 "no sourcemap found"
        // warnings. Deleting nothing here keeps those maps present for the
        // (deduped) re-scan; scripts/remove-sourcemaps.mjs deletes all maps
        // unconditionally after the build, so they never reach the deployed
        // output even when an upload fails.
        filesToDeleteAfterUpload: [],
      },
    }),
  ],
  vite: {
    envDir: '../..',
    build: {
      // Both chunks above the default 500 kB are intentionally heavy and
      // intentionally not on the critical path: renderVisualEditing (~780 kB,
      // preview-only) and the mux/hls.js player (~740 kB, lazy-loaded per
      // frame, ADR-0036). 900 keeps the tripwire armed for everything else.
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          // @sanity/ui and framer-motion (pulled in by the preview-only visual
          // editing bundle) ship "use client" banners, a React Server
          // Components convention that is meaningless in Astro. Rollup strips
          // them and warns per file (~70 lines of noise). Only silence that
          // exact case — other directives (e.g. "use server") and all other
          // warnings still print.
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client'))
            return
          defaultHandler(warning)
        },
        onLog(level, log, defaultHandler) {
          // Rollup can't map warning locations through framer-motion's own
          // shipped sourcemaps, adding a few SOURCEMAP_ERROR lines per build.
          // These travel via onLog, not onwarn. Only silence them for
          // third-party code; problems in our own files still report.
          if (log.code === 'SOURCEMAP_ERROR' && log.id?.includes('node_modules')) return
          defaultHandler(level, log)
        },
      },
    },
    define: {
      // The client bundle can only read inlined values. The release matches the
      // commit SHA the source-map upload registers for each production build.
      'import.meta.env.SENTRY_DSN': JSON.stringify(env.SENTRY_DSN ?? ''),
      'import.meta.env.SENTRY_RELEASE': JSON.stringify(env.VERCEL_GIT_COMMIT_SHA ?? ''),
      'import.meta.env.SENTRY_ENVIRONMENT': JSON.stringify(env.VERCEL_ENV ?? 'development'),
      // Lets src/middleware.ts apply the same gate for endpoint-only requests.
      'import.meta.env.SENTRY_ENABLED': JSON.stringify(String(sentryEnabled)),
    },
  },
})
