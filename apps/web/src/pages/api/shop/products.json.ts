import type { APIRoute } from 'astro';
import { listProducts } from '../../../lib/shopify';
import { jsonError } from '../../../lib/shopify-api';

// Shopify handles are lowercase alphanumeric with hyphens; anything else is
// rejected before it reaches the Storefront API.
const HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const GET: APIRoute = async ({ url }) => {
  const after = url.searchParams.get('after');
  if (after && after.length > 512) return new Response(JSON.stringify({ error: 'Invalid pagination cursor.' }), { status: 400 });
  const collection = url.searchParams.get('collection');
  if (collection && (collection.length > 255 || !HANDLE_PATTERN.test(collection)))
    return new Response(JSON.stringify({ error: 'Invalid collection handle.' }), { status: 400 });
  try {
    return Response.json(await listProducts(after, collection), { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (error) {
    return jsonError(error);
  }
};
