import type { APIRoute } from 'astro';
import { cartView, removeCartLine, ShopifyError } from '../../../../lib/shopify';
import { readCartId } from '../../../../lib/shopify-cart';
import { isShopifyId, jsonError, mutationBody } from '../../../../lib/shopify-api';

export const POST: APIRoute = async (context) => {
  try {
    const body = await mutationBody(context);
    const cartId = readCartId(context.cookies);
    if (!cartId) throw new ShopifyError('Your cart is empty.', 404);
    if (!isShopifyId(body.lineId)) throw new ShopifyError('Invalid cart line.', 400);
    const cart = await removeCartLine(cartId, body.lineId);
    return Response.json(cartView(cart), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return jsonError(error);
  }
};
