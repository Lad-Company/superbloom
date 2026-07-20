# Shop functional implementation specification

**Status:** Ready for implementation (functional scope only; visual design explicitly deferred)  
**Decision source:** [ADR-0019](../adr/0019-shopify-storefront-integration.md), [ADR-0003](../adr/0003-no-database.md)  
**Design source:** None. The signed Figma contains no approved Shop screens. A separate visual specification and review are still required.

## Goal

Implement a functional headless Shopify Shop using the Storefront API. The Shop must support product browse, product detail, variant selection, cart management, and Shopify-hosted checkout. This spec defines functional acceptance only and does not invent visual authority.

## Scope

This implementation includes:

- Product browse at `/shop` with all active Shopify products
- Progressive Load More (24 products per batch)
- Product detail at `/shop/products/[handle]`
- Variant selection (size, color, etc.) with availability states
- Sold-out and unavailable product states
- Persistent cart drawer accessible site-wide
- Cart page at `/cart` with quantity adjustment, line-item removal, subtotal display
- Shopify-hosted checkout (redirect to Shopify Checkout)
- Footer links to Shopify-hosted policy pages (Privacy, Terms, Shipping, Refund)
- Server-side Storefront API integration with secure token management
- Graceful error states for API failures, rate limits, network timeouts
- Sentry observability with PII redaction

It explicitly excludes from MVP:

- Product search and filtering
- Collection browse pages
- Customer accounts and order history
- Reviews, wishlists, recommendations
- Discount code UI (Shopify applies codes at checkout; no storefront UI)
- Multi-currency or region selection (default Shopify currency only)
- Sanity-based merchandising (curated products, hero, collections)
- Final visual design approval (components use semantic Surface Roles and existing primitives but are marked as "functional approval only")

## Integration architecture

### Storefront API approach

- All product, variant, and cart queries go through Astro server endpoints
- Shopify Storefront Access Token stored in `SHOPIFY_STOREFRONT_TOKEN` environment variable
- Storefront API URL stored in `SHOPIFY_STORE_DOMAIN` environment variable
- Cart-cookie encryption key stored in `SHOPIFY_CART_COOKIE_SECRET`
- No API tokens exposed client-side
- Client-side cart operations call Astro endpoints, which proxy to Shopify
- Server actions return typed responses with error states

### Cart persistence strategy

- Shopify manages cart state on their servers
- Store only the Shopify cart ID in an encrypted, `HttpOnly`, `Secure`, `SameSite=Lax` first-party cookie
- Server routes resolve the cart by cookie; an invalid or expired ID clears the cookie, and a new cart is created on the next add operation
- No server-side session or custom database
- Cart drawer and `/cart` page resolve the same Shopify cart
- Cart IDs are anonymous until checkout (no auth required)
- Never return or log the capability-bearing cart ID

### Error handling

- API failures: display user-friendly error message, log to Sentry
- Rate limits: retry with exponential backoff, surface "slow down" message if persistent
- Network timeouts: display connectivity error, allow retry
- Invalid cart ID: silently create new cart
- Sold-out variant selected: disable add-to-cart, show "Sold Out" state
- Checkout redirect failure: display error, preserve cart

## Content contract

### Shopify product data

Products are fetched via Storefront API. No Sanity schema for products (Shopify is source of truth).

Required product fields:
- `id` (Shopify product ID)
- `handle` (URL slug)
- `title`
- `description` (HTML string)
- `featuredImage` (URL, alt text)
- `priceRange` (min/max)
- `variants` (array of variant objects)
- `availableForSale` (boolean)

Required variant fields:
- `id` (Shopify variant ID)
- `title` (e.g., "Small / Red")
- `price`
- `availableForSale` (boolean)
- `quantityAvailable` (integer or null)
- `selectedOptions` (array of `{ name, value }`)
- `image` (optional variant-specific image)

### Cart data structure

The server-side Shopify cart includes `id` and `checkoutUrl`, but neither value appears in JSON returned to client JavaScript. Client-facing cart responses contain only:
- `lines` (array of cart line items)
- `subtotalAmount` (subtotal before shipping/tax)
- `itemCount`
- `checkoutPath` fixed to the same-origin `/api/shop/cart/checkout`

Cart line item:
- `id` (line item ID)
- `merchandise` (variant object)
- `quantity` (integer)

## Route implementation

### `/shop` (Product browse)

`apps/web/src/pages/shop/index.astro`:

- Fetch all active products from Shopify (paginated, 24 per batch)
- Render product card grid
- Progressive Load More button (loads next 24, baseline works without JS via query params)
- Product cards display: featured image, title, price range, "Sold Out" badge if unavailable
- Cards link to `/shop/products/[handle]`

### `/shop/products/[handle]` (Product detail)

`apps/web/src/pages/shop/products/[handle].astro`:

- Fetch product by handle from Shopify
- If product not found, return 404
- Render product detail: featured image, title, price, description, variant selector, add-to-cart button
- Variant selector: dropdowns for each option (size, color, etc.)
- Selected variant updates price and availability
- "Add to Cart" button disabled if variant sold out
- On add-to-cart: call server action to add to cart, show success feedback, update cart badge count

### `/cart` (Cart page)

`apps/web/src/pages/cart/index.astro`:

- Resolve the current cart from the encrypted cookie
- If cart empty, show empty state
- Render cart lines: product image, title, variant, quantity control (–/+), line total, remove button
- Display subtotal
- "Checkout" uses the same-origin checkout endpoint, which redirects to Shopify-hosted checkout
- Quantity change and remove call server actions
- Footer links to Shopify-hosted policy pages

### Cart drawer (site-wide)

`apps/web/src/components/cart/CartDrawer.astro`:

- Persistent drawer component accessible from site header cart icon
- Displays cart lines (same as cart page but condensed)
- Subtotal and "View Cart" / "Checkout" CTAs
- Drawer opens when item added to cart
- Uses same cart data as `/cart` page

## Server endpoint implementation

Add Astro endpoints under `apps/web/src/pages/api/shop/`:

**`/api/shop/products.json`**:
- Accepts an optional Shopify pagination cursor and a server-owned limit fixed at 24
- Fetches products from Shopify Storefront API
- Returns `{ products, pageInfo: { hasNextPage, endCursor } }`

**`/api/shop/products/[handle].json`**:
- Fetches single product by handle
- Returns product object or 404

**`/api/shop/cart/get.json`**:
- Reads the encrypted cart cookie
- Fetches and returns the sanitized client cart view, or an empty-cart response when absent or invalid

**`/api/shop/cart/add.json`**:
- Accepts `{ variantId, quantity }`; creates a cart when no valid cookie exists
- Adds the item and rotates the encrypted cart cookie
- Returns the sanitized updated cart view without `id` or `checkoutUrl`

**`/api/shop/cart/update.json`**:
- Accepts `{ lineId, quantity }` and resolves the cart from the cookie
- Updates line item quantity
- Returns the sanitized updated cart view

**`/api/shop/cart/remove.json`**:
- Accepts `{ lineId }` and resolves the cart from the cookie
- Removes line item from cart
- Returns the sanitized updated cart view

**`/api/shop/cart/checkout`**:
- Resolves the cart from the encrypted cookie
- Returns a same-request redirect to Shopify's `checkoutUrl`
- Returns the empty-cart or retryable error state instead of exposing the URL in JSON

All endpoints use server-side Storefront API client with secure token. All endpoints log errors to Sentry with PII redaction (no customer email, address, or payment info).
Mutation endpoints accept same-origin POST requests only, verify `Origin`/`Sec-Fetch-Site`, require JSON or form content types as appropriate, and reject unbounded quantities or malformed Shopify IDs.

## Component implementation

Add components under `apps/web/src/components/shop/`:

- `ProductCard.astro`: product card for browse page
- `ProductGrid.astro`: grid layout with Load More
- `ProductDetail.astro`: product detail layout
- `VariantSelector.astro`: dropdown selectors for variant options
- `AddToCartButton.astro`: add-to-cart with loading/success/error states
- `CartLineItem.astro`: cart line with quantity controls and remove
- `CartDrawer.astro`: persistent drawer
- `EmptyCart.astro`: empty state for cart page

Components use existing primitives:
- `MediaFrame` for product images
- `Button` for CTAs and controls
- `SurfaceSection` and `PageGrid` for layout
- Semantic Surface Roles (no raw hues)

Visual design is functional and consistent with existing system but explicitly marked as "not final approved design."

## Functional behavior

### Product browse

- Load 24 products on initial page load
- "Load More" button loads next 24 products
- Baseline next/previous links carry Shopify cursors; JavaScript enhances the next link into append-in-place "Load More"
- Product cards display sold-out badge when `availableForSale === false`

### Product detail

- Default to first available variant on page load
- Variant selector dropdowns update selected variant
- Price and availability update when variant changes
- "Add to Cart" button disabled when variant sold out
- Add to cart success: show feedback, increment cart badge, open cart drawer (optional enhancement)

### Cart management

- Cart badge in header shows line item count
- Cart drawer opens on cart icon click
- Quantity controls: decrement, increment, manual input
- Quantity cannot go below 1 (use remove instead)
- Remove button removes line item immediately
- Subtotal updates on any cart change
- "Checkout" button redirects to Shopify checkout URL

### Cart persistence

- Cart ID remains only in the encrypted first-party cookie
- Server routes fetch the current cart from Shopify
- If the cart is invalid or expired, clear the cookie and present an empty cart
- Cart persists across sessions until either cookie or Shopify cart expiry
- No server-side cart storage or sync

### Error states

- Product not found: 404 page
- API error: "Unable to load products. Please try again."
- Network error: "Connection issue. Check your internet."
- Add-to-cart failure: "Could not add item. Please try again."
- Checkout redirect failure: "Could not proceed to checkout. Please try again."

## Accessibility requirements

- All product cards keyboard-operable with visible focus
- Variant selector dropdowns keyboard-accessible
- Cart quantity controls keyboard-operable
- Cart drawer closeable with Escape key
- Focus trap in cart drawer when open
- Loading states announced to screen readers
- Error messages announced to screen readers
- Checkout button indicates external redirect

## Observability and monitoring

- Sentry integration for Astro errors, performance, structured logs
- Redact PII: no customer email, address, phone, payment info in logs
- Log all Shopify API errors with error code and message
- Log rate limit hits and retry attempts
- Alert to Discord on critical errors (API token invalid, store unreachable, checkout redirect failures)
- Record operational failures and latency only; analytics events are deferred

## Security and resilience

- Storefront Access Token and cart-cookie secret stay in server environment variables
- All cart operations proxied through Astro server endpoints
- Validate all user input (quantity, variant ID, cart ID)
- Rate limit cart operations (Vercel WAF or endpoint-level throttling)
- Never log, expose, or include the full Shopify cart ID in Sentry context
- HTTPS-only for all shop routes

## Policy pages and legal

- Query Shopify's Shop policy objects for Privacy, Terms, Shipping, and Refund URLs rather than constructing paths
- All four policies must resolve before launch
- Links open in new tab with indicator

## Implementation sequence

1. Set up Shopify Storefront API client and environment variables
2. Implement server endpoints for products and cart operations
3. Build product browse page with Load More
4. Build product detail page with variant selector and add-to-cart
5. Build cart page with quantity controls and checkout button
6. Build cart drawer component
7. Add cart badge to header navigation
8. Add policy page links to footer
9. Implement encrypted HTTP-only cart-cookie persistence
10. Add error handling and Sentry logging
11. Test all flows manually: browse, detail, add, cart, checkout redirect
12. Test sold-out states, error states, and no-JS baseline

## Acceptance criteria (functional only)

- Product browse displays all active products, 24 per batch
- Load More loads next 24 products
- Product detail displays correct variant price and availability
- Variant selector updates selected variant
- Add to cart adds correct variant with quantity
- Cart displays all line items with correct quantity and subtotal
- Quantity controls update cart via Shopify API
- Remove button removes line item
- Checkout button redirects to Shopify checkout URL
- Cart persists across sessions without exposing its Shopify cart ID to client JavaScript
- Sold-out products show "Sold Out" badge and disabled add-to-cart
- All error states display user-friendly messages
- API errors logged to Sentry without PII
- All routes work without JavaScript for baseline reading
- Policy links open Shopify-hosted pages in new tab

**Visual acceptance explicitly deferred**: Components may use semantic roles and existing primitives as a functional baseline but do not claim final visual approval. A dedicated visual specification must define Shop typography, layout, card design, and responsive behavior.

## Validation

Run from the repository root:

```sh
pnpm --filter web astro check
pnpm --filter web build
```

Then manually verify:
- Product browse with Load More
- Product detail with variant selection for single-variant, multi-variant, sold-out products
- Add to cart with success/error states
- Cart page with quantity change, remove, empty state
- Cart drawer with open/close, add-to-cart trigger
- Checkout redirect to Shopify
- Policy page links
- Cart persistence across page reloads
- Error states for API failures
- Sentry logs for errors (verify no PII in logs)

Test with real Shopify products in development store covering:
- Single variant product
- Multi-variant product (size + color)
- Sold-out product
- Discounted product (verify price display)
