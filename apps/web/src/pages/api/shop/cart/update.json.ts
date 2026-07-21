import type { APIRoute } from 'astro';
import { cartView, updateCartLine } from '../../../../lib/shopify';
import { readCartId } from '../../../../lib/shopify-cart';
import { isShopifyId, jsonError, mutationBody, quantity } from '../../../../lib/shopify-api';
import { ShopifyError } from '../../../../lib/shopify';

export const POST: APIRoute = async (context) => {
  try {
    const body = await mutationBody(context);
    const cartId = readCartId(context.cookies);
    if (!cartId) throw new ShopifyError('Your cart is empty.', 404);
    if (!isShopifyId(body.lineId)) throw new ShopifyError('Invalid cart line.', 400);
    const cart = await updateCartLine(cartId, body.lineId, quantity(body.quantity));
    return Response.json(cartView(cart), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return jsonError(error);
  }
};
