import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { AstroCookies } from 'astro';

const COOKIE_NAME = 'superbloom_shop_cart';
const MAX_AGE = 60 * 60 * 24 * 30;

function key() {
  const secret = import.meta.env.SHOPIFY_CART_COOKIE_SECRET;
  if (!secret) throw new Error('SHOPIFY_CART_COOKIE_SECRET is not configured.');
  return createHash('sha256').update(secret).digest();
}

function seal(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}

function unseal(value: string) {
  const payload = Buffer.from(value, 'base64url');
  if (payload.length < 29) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key(), payload.subarray(0, 12));
    decipher.setAuthTag(payload.subarray(12, 28));
    return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export function readCartId(cookies: AstroCookies) {
  const cookie = cookies.get(COOKIE_NAME)?.value;
  return cookie ? unseal(cookie) : null;
}

export function writeCartId(cookies: AstroCookies, cartId: string) {
  cookies.set(COOKIE_NAME, seal(cartId), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearCartId(cookies: AstroCookies) {
  cookies.delete(COOKIE_NAME, { path: '/' });
}
