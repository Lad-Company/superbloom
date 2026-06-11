import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: 'l9mhqdtj',
  dataset: 'production',
  apiVersion: '2026-06-01',
  useCdn: false,
});
