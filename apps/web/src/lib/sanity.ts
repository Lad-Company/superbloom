import { createClient } from '@sanity/client';
import type { ClientReturn, QueryParams, SanityClient } from '@sanity/client';
import * as Sentry from '@sentry/astro';

const config = {
  projectId: 'l9mhqdtj',
  dataset: 'production',
  apiVersion: '2026-06-01',
} as const;

export const sanityClient = createClient({
  ...config,
  useCdn: true,
});

// Preview (draft mode) requests read drafts straight from the API with a
// viewer-scoped token; the CDN only serves published content. Never reuse
// the write-capable SANITY_API_TOKEN here.
export function getSanityClient(preview: boolean) {
  if (!preview) return sanityClient;
  return createClient({
    ...config,
    useCdn: false,
    perspective: 'drafts',
    token: import.meta.env.SANITY_API_READ_TOKEN,
  });
}

const FETCH_TIMEOUT_MS = 6_000;
const RETRY_DELAY_MS = 250;

// The Sanity client has no default timeout, so a hung request burns the whole
// Vercel function budget and surfaces as Vercel's generic error page.
// fetchSafe bounds each attempt, retries once on transient failures (network
// or 5xx — a 4xx means the query itself is wrong and retrying won't help),
// reports the final failure to Sentry, and returns `undefined`.
//
// Routes read the result as tri-state: `undefined` = fetch failed (render the
// branded 500), `null` = query matched nothing (existing 404 / CMS-fallback
// handling), anything else = success.
export async function fetchSafe<R = unknown, const G extends string = string>(
  client: SanityClient,
  query: G,
  params: QueryParams = {},
): Promise<ClientReturn<G, R> | undefined> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // The cast is sound: G is the caller's query literal, so the typegen
      // map resolves the same way it would for a direct client.fetch call.
      // TS just can't prove it while G is still generic inside this body.
      const result = await client.fetch(query, params, { timeout: FETCH_TIMEOUT_MS });
      return result as ClientReturn<G, R>;
    } catch (error) {
      const status = (error as { statusCode?: number })?.statusCode;
      const retryable = status === undefined || status >= 500;
      if (attempt === 0 && retryable) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }
      Sentry.captureException(error);
      return undefined;
    }
  }
  return undefined;
}
