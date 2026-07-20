# Shopify Storefront API integration

The Shop is a functional headless Shopify integration using the Storefront API. All merchandising, inventory, checkout, and policy pages are Shopify-owned for MVP. No custom database or cart storage; cart persistence uses Shopify-managed cart IDs held in an encrypted, HTTP-only first-party cookie. This decision defines functional architecture only. A separate visual specification is required before the Shop receives visual acceptance.

**Why Storefront API over Admin API**: The Storefront API is designed for customer-facing storefronts and includes cart management, variant selection, and checkout URL generation. The Admin API is for internal operations and would require reimplementing checkout. Storefront API + Shopify-hosted checkout keeps the implementation simple and secure.

**Why no custom database for carts**: Shopify manages cart state on its servers. The app stores only the cart ID in an encrypted, `HttpOnly`, `Secure`, `SameSite=Lax` cookie and resolves current state from Shopify. Expired or invalid IDs are discarded and replaced. Keeping the capability-bearing cart ID out of JavaScript reduces accidental exposure without duplicating cart contents or adding cleanup jobs.

**Why defer visual design**: The signed-off Figma contains no approved Shop screens. A functional specification unblocks API, product, cart, checkout, and test work without inventing visual authority. A dedicated design session must establish Shop typography, layout, card design, and responsive behavior before visual acceptance. The functional spec is implementation-ready; the visual spec does not yet exist.

**Functional scope**:
- Product browse at `/shop` with progressive Load More (24 per batch)
- Product detail at `/shop/products/[handle]` with variant selection
- Availability and sold-out states
- Persistent cart drawer accessible site-wide
- Cart page at `/cart` with quantity adjustment, line-item removal, and subtotal
- Shopify-hosted checkout (redirect to Shopify domain)
- Footer links to Shopify-hosted Privacy, Terms, Shipping, and Refund policy pages

**Excluded from MVP**:
- Product search and filtering
- Collection browse pages
- Customer accounts and order history
- Reviews, wishlists, and recommendations
- Discount code UI (Shopify applies codes at checkout; no storefront UI)
- Multi-currency or region selection (default Shopify currency only)
- Sanity-based merchandising (curated featured products, hero, collections)

**Integration approach**:
- Server-side Storefront API queries from Astro endpoints
- Secure Storefront Access Token stored in environment variables
- No exposed API tokens client-side
- Cart operations via server actions, not direct client API calls
- Graceful error states for API failures, rate limits, and network timeouts
- Sentry observability with PII redaction (no customer email/address logging)

**Cart persistence strategy**: Server routes read and rotate the encrypted first-party cart cookie. If its Shopify cart is invalid or expired, the server clears it and creates a new cart only when the visitor adds merchandise. The cart drawer and `/cart` resolve the same Shopify cart. No cart ID is returned to client JavaScript or written to logs.

**Visual contract**: Functional components use semantic Surface Roles and existing primitives (`Button`, `MediaFrame`, `PageGrid`). Product cards compose `MediaFrame` + metadata. Cart UI uses established form controls and surface contracts. This preserves visual consistency with the existing system while explicitly marking Shop visuals as "approved for function, not final design."

**Considered options**: Shopify Buy Button widget; custom Admin API + checkout; Snipcart; complete custom checkout.

**Reversibility**: medium. The Storefront API and Shopify-hosted checkout choice shapes routes, cart behavior, and operational setup, but product and order data remain in Shopify and the cart persistence adapter is local to the web app.
