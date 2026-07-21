import type { APIRoute } from 'astro';
import { addCartLines, cartView, getCart, ShopifyError } from '../../../../lib/shopify';
import { clearCartId, readCartId, writeCartId } from '../../../../lib/shopify-cart';
import { isShopifyId, jsonError, mutationBody, quantity } from '../../../../lib/shopify-api';

export const POST: APIRoute = async (context) => {
  try {
    const body = await mutationBody(context);
    if (!isShopifyId(body.variantId)) throw new ShopifyError('Invalid variant.', 400);
    const currentCartId = readCartId(context.cookies);
    const existingCart = currentCartId ? await getCart(currentCartId) : null;
    if (currentCartId && !existingCart) clearCartId(context.cookies);
    const cart = await addCartLines(existingCart?.id ?? null, body.variantId, quantity(body.quantity));
    writeCartId(context.cookies, cart.id);
    return Response.json(cartView(cart), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return jsonError(error);
  }
};
