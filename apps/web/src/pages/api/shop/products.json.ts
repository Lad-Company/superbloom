import type { APIRoute } from 'astro';
import { listProducts } from '../../../lib/shopify';
import { jsonError } from '../../../lib/shopify-api';

export const GET: APIRoute = async ({ url }) => {
  const after = url.searchParams.get('after');
  if (after && after.length > 512) return new Response(JSON.stringify({ error: 'Invalid pagination cursor.' }), { status: 400 });
  try {
    return Response.json(await listProducts(after), { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (error) {
    return jsonError(error);
  }
};
