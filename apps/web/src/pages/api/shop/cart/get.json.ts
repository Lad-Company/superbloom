import type { APIRoute } from 'astro';
import { clearCartId, readCartId } from '../../../../lib/shopify-cart';
import { cartView, getCart } from '../../../../lib/shopify';
import { emptyCart, jsonError } from '../../../../lib/shopify-api';

export const GET: APIRoute = async ({ cookies }) => {
  const cartId = readCartId(cookies);
  if (!cartId) return Response.json(emptyCart(), { headers: { 'Cache-Control': 'no-store' } });
  try {
    const cart = await getCart(cartId);
    if (!cart) {
      clearCartId(cookies);
      return Response.json(emptyCart(), { headers: { 'Cache-Control': 'no-store' } });
    }
    return Response.json(cartView(cart), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return jsonError(error);
  }
};
