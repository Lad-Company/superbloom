import type { APIRoute } from 'astro';
import { getCart, ShopifyError } from '../../../../lib/shopify';
import { clearCartId, readCartId } from '../../../../lib/shopify-cart';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const cartId = readCartId(cookies);
  if (!cartId) return redirect('/cart?error=empty', 302);
  try {
    const cart = await getCart(cartId);
    if (!cart) {
      clearCartId(cookies);
      return redirect('/cart?error=empty', 302);
    }
    const checkout = new URL(cart.checkoutUrl);
    if (checkout.protocol !== 'https:') throw new ShopifyError('Unsafe checkout URL.');
    return redirect(checkout.toString(), 302);
  } catch {
    return redirect('/cart?error=checkout', 302);
  }
};
