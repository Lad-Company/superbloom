import type { APIRoute } from 'astro';
import { getProduct } from '../../../../lib/shopify';
import { jsonError } from '../../../../lib/shopify-api';

export const GET: APIRoute = async ({ params }) => {
  const handle = params.handle;
  if (!handle || !/^[a-z0-9-]+$/i.test(handle)) return new Response(JSON.stringify({ error: 'Product not found.' }), { status: 404 });
  try {
    const product = await getProduct(handle);
    return product
      ? Response.json(product, { headers: { 'Cache-Control': 'private, max-age=60' } })
      : new Response(JSON.stringify({ error: 'Product not found.' }), { status: 404 });
  } catch (error) {
    return jsonError(error);
  }
};
