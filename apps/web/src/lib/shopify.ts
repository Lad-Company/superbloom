const SHOPIFY_API_VERSION = '2025-10';
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 2;

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ProductImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: Array<{ name: string; value: string }>;
  image: ProductImage | null;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  featuredImage: ProductImage | null;
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  availableForSale: boolean;
  options: Array<{ name: string; values: string[] }>;
  variants: ProductVariant[];
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: ProductVariant & { product: Pick<Product, 'handle' | 'title'> };
  cost: { totalAmount: Money };
}

export interface CartView {
  lines: CartLine[];
  subtotalAmount: Money | null;
  itemCount: number;
  checkoutPath: '/api/shop/cart/checkout';
}

interface ShopifyCart extends CartView {
  id: string;
  checkoutUrl: string;
}

interface RawCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: { nodes: CartLine[] };
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

type GraphQLResponse<T> = { data?: T; errors?: Array<{ message: string }> };

export class ShopifyError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = 'ShopifyError';
  }
}

function storeUrl() {
  const domain = import.meta.env.SHOPIFY_STORE_DOMAIN;
  const token = import.meta.env.SHOPIFY_STOREFRONT_TOKEN;
  if (!domain || !token) {
    console.error('Shopify integration failure', {
      failure: 'missing_configuration',
      domainConfigured: Boolean(domain),
      tokenConfigured: Boolean(token),
    });
    throw new ShopifyError('Shop is not configured.', 503);
  }
  return {
    url: `https://${domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}/api/${SHOPIFY_API_VERSION}/graphql.json`,
    token,
  };
}

async function request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const { url, token } = storeUrl();
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Shopify-Storefront-Private-Token': token,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
      if (!response.ok) {
        console.error('Shopify integration failure', {
          failure: 'http',
          status: response.status,
          attempt: attempt + 1,
        });
        const message = response.status === 429
          ? 'The shop is busy. Please slow down and try again shortly.'
          : 'Shop service is temporarily unavailable.';
        throw new ShopifyError(message, response.status);
      }
      const body = (await response.json()) as GraphQLResponse<T>;
      if (body.errors?.length || !body.data) {
        console.error('Shopify integration failure', {
          failure: 'graphql',
          errorCount: body.errors?.length ?? 0,
          hasData: Boolean(body.data),
          attempt: attempt + 1,
        });
        throw new ShopifyError('Shop service returned an error.');
      }
      return body.data;
    } catch (error) {
      lastError = error;
      if (!(error instanceof ShopifyError)) {
        console.error('Shopify integration failure', {
          failure: 'transport',
          errorName: error instanceof Error ? error.name : 'unknown',
          attempt: attempt + 1,
        });
      }
      if (attempt < MAX_RETRIES) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError instanceof ShopifyError) throw lastError;
  throw new ShopifyError('Unable to reach the shop service.');
}

const productFields = `
  id handle title descriptionHtml availableForSale
  featuredImage { url altText width height }
  priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
  options { name values }
  variants(first: 100) {
    nodes {
      id title availableForSale
      price { amount currencyCode }
      selectedOptions { name value }
      image { url altText width height }
    }
  }
`;

const cartFields = `
  id checkoutUrl totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 100) {
    nodes {
      id quantity cost { totalAmount { amount currencyCode } }
      merchandise {
        ... on ProductVariant {
          id title availableForSale
          price { amount currencyCode }
          selectedOptions { name value }
          image { url altText width height }
          product { handle title }
        }
      }
    }
  }
`;

function normalizeProduct(product: Omit<Product, 'variants'> & { variants: { nodes: ProductVariant[] } }): Product {
  return { ...product, variants: product.variants.nodes };
}

function cartView(cart: ShopifyCart): CartView {
  return {
    lines: cart.lines,
    subtotalAmount: cart.subtotalAmount,
    itemCount: cart.itemCount,
    checkoutPath: '/api/shop/cart/checkout',
  };
}

function normalizeCart(cart: RawCart): ShopifyCart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    itemCount: cart.totalQuantity,
    subtotalAmount: cart.cost.subtotalAmount,
    lines: cart.lines.nodes,
    checkoutPath: '/api/shop/cart/checkout',
  };
}

export async function listProducts(after: string | null) {
  const data = await request<{ products: { nodes: Array<Omit<Product, 'variants'> & { variants: { nodes: ProductVariant[] } }>; pageInfo: PageInfo } }>(
    `query Products($after: String) { products(first: 24, after: $after, sortKey: TITLE) { nodes { ${productFields} } pageInfo { hasNextPage endCursor } } }`,
    { after },
  );
  return { products: data.products.nodes.map(normalizeProduct), pageInfo: data.products.pageInfo };
}

export async function getProduct(handle: string) {
  const data = await request<{ product: (Omit<Product, 'variants'> & { variants: { nodes: ProductVariant[] } }) | null }>(
    `query Product($handle: String!) { product(handle: $handle) { ${productFields} } }`,
    { handle },
  );
  return data.product ? normalizeProduct(data.product) : null;
}

export async function getCart(id: string) {
  const data = await request<{ cart: RawCart | null }>(
    `query Cart($id: ID!) { cart(id: $id) { ${cartFields} } }`, { id },
  );
  return data.cart ? normalizeCart(data.cart) : null;
}

export async function addCartLines(cartId: string | null, variantId: string, quantity: number) {
  if (!cartId) {
    const data = await request<{ cartCreate: { cart: RawCart | null; userErrors: Array<{ message: string }> } }>(
      `mutation CartCreate($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { ${cartFields} } userErrors { message } } }`,
      { lines: [{ merchandiseId: variantId, quantity }] },
    );
    if (data.cartCreate.userErrors.length || !data.cartCreate.cart) throw new ShopifyError('Could not add this item to your cart.', 422);
    return normalizeCart(data.cartCreate.cart);
  }
  const data = await request<{ cartLinesAdd: { cart: RawCart | null; userErrors: Array<{ message: string }> } }>(
    `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${cartFields} } userErrors { message } } }`,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] },
  );
  if (data.cartLinesAdd.userErrors.length || !data.cartLinesAdd.cart) throw new ShopifyError('Could not add this item to your cart.', 422);
  return normalizeCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number) {
  const data = await request<{ cartLinesUpdate: { cart: RawCart | null; userErrors: Array<{ message: string }> } }>(
    `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${cartFields} } userErrors { message } } }`,
    { cartId, lines: [{ id: lineId, quantity }] },
  );
  if (data.cartLinesUpdate.userErrors.length || !data.cartLinesUpdate.cart) throw new ShopifyError('Could not update your cart.', 422);
  return normalizeCart(data.cartLinesUpdate.cart);
}

export async function removeCartLine(cartId: string, lineId: string) {
  const data = await request<{ cartLinesRemove: { cart: RawCart | null; userErrors: Array<{ message: string }> } }>(
    `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${cartFields} } userErrors { message } } }`,
    { cartId, lineIds: [lineId] },
  );
  if (data.cartLinesRemove.userErrors.length || !data.cartLinesRemove.cart) throw new ShopifyError('Could not update your cart.', 422);
  return normalizeCart(data.cartLinesRemove.cart);
}

export { cartView };
