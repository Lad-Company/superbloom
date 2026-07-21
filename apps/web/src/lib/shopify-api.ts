import type { APIContext } from 'astro';
import { ShopifyError } from './shopify';

const SHOPIFY_ID = /^gid:\/\/shopify\/(?:ProductVariant|CartLine)\/[A-Za-z0-9_.-]+(?:\?[A-Za-z0-9_.=&-]+)?$/;

export function jsonError(error: unknown) {
  const status = error instanceof ShopifyError ? error.status : 500;
  const message = error instanceof ShopifyError ? error.message : 'Something went wrong. Please try again.';
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function emptyCart() {
  return { lines: [], subtotalAmount: null, itemCount: 0, checkoutPath: '/api/shop/cart/checkout' as const };
}

export function isShopifyId(value: unknown): value is string {
  return typeof value === 'string' && SHOPIFY_ID.test(value);
}

export async function mutationBody(context: APIContext) {
  if (context.request.method !== 'POST') throw new ShopifyError('Method not allowed.', 405);
  const fetchSite = context.request.headers.get('sec-fetch-site');
  const origin = context.request.headers.get('origin');
  if ((fetchSite && fetchSite !== 'same-origin') || (origin && origin !== context.url.origin)) {
    throw new ShopifyError('Invalid request origin.', 403);
  }
  if (!context.request.headers.get('content-type')?.includes('application/json')) {
    throw new ShopifyError('Expected JSON request body.', 415);
  }
  try {
    return await context.request.json() as Record<string, unknown>;
  } catch {
    throw new ShopifyError('Malformed request body.', 400);
  }
}

export function quantity(value: unknown) {
  if (!Number.isInteger(value) || typeof value !== 'number' || value < 1 || value > 20) {
    throw new ShopifyError('Quantity must be between 1 and 20.', 400);
  }
  return value;
}
