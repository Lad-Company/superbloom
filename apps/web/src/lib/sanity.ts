import { createClient } from '@sanity/client';

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
