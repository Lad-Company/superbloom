// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import UnoCSS from '@unocss/astro';
import sentry from '@sentry/astro';
import { loadEnv } from 'vite';

// Env lives at the repo root (vite.envDir '../..'); loadEnv exposes it to this
// config file both locally (.env.local) and on Vercel (process.env).
const env = loadEnv(process.env.NODE_ENV ?? 'development', '../..', '');

const onVercel = Boolean(env.VERCEL);
// Errors are reported from production only: preview deploys and local dev stay
// out of Sentry (mirrors the gaMode preview exclusion, ADR-0026).
const sentryEnabled = Boolean(env.SENTRY_DSN) &&
  (onVercel ? env.VERCEL_ENV === 'production' : process.env.NODE_ENV === 'production');
// Source maps upload only from Vercel production builds, never local ones.
const sentryAuthToken =
  onVercel && env.VERCEL_ENV === 'production' ? env.SENTRY_AUTH_TOKEN : undefined;

// https://astro.build/config
export default defineConfig({
  site: 'https://superbloomhouse.com',
  output: 'server',
  adapter: vercel(),
  integrations: [
    UnoCSS(),
    sentry({
      enabled: sentryEnabled,
      org: env.SENTRY_ORG,
      project: env.SENTRY_PROJECT,
      authToken: sentryAuthToken,
      telemetry: false,
      sourcemaps: {
        // Uploaded maps are not shipped with the deployed bundle.
        filesToDeleteAfterUpload: ['dist/**/*.map'],
      },
    }),
  ],
  vite: {
    envDir: '../..',
    define: {
      // The client bundle can only read inlined values. The release matches the
      // commit SHA the source-map upload registers for each production build.
      'import.meta.env.SENTRY_DSN': JSON.stringify(env.SENTRY_DSN ?? ''),
      'import.meta.env.SENTRY_RELEASE': JSON.stringify(env.VERCEL_GIT_COMMIT_SHA ?? ''),
      'import.meta.env.SENTRY_ENVIRONMENT': JSON.stringify(env.VERCEL_ENV ?? 'development'),
    },
  },
});
