# MVP completion implementation specification

**Status:** Ready for implementation  
**Decision source:** Composite of all ADRs and design-system specs  

> **Composition authority:** The [CMS Content Composition implementation specification](./cms-content-composition-spec.md) governs Article models, Content Cards, Content Layout Rows, Index and Work sections, Zine Issue membership and reading formats, and prelaunch migration policy. Where this umbrella checklist or a linked component document differs, use the unified specification.

## Goal

Complete all remaining work required to ship the Superbloom MVP site. This umbrella spec identifies gaps across routes, content, forms, observability, SEO, and QA that are not covered by dedicated implementation specs. Use this as the final checklist before launch readiness.

## Scope

This spec covers:

- Remaining homepage gaps (Home Hero, Home-Zine, Capes)
- Newsletter subscription form
- Contact form submission and routing
- Site settings singleton (social links)
- Baseline SEO (meta tags, OG, canonical, sitemap, robots.txt)
- 404 page
- Shared Site Shell final assembly
- Observability (Sentry, Discord alerts)
- Responsive, accessibility, performance, browser QA
- Content readiness checklist
- Dead link elimination

It does not cover:
- Motion (explicitly deferred per ADR-0015)
- Analytics (deferred)
- Custom SEO fields per content type (deferred; baseline derived metadata only)

## Homepage remaining work

### Home Hero (required)

- **Status:** Partially implemented; gaps documented in [home-hero.md](./home-hero.md)
- **Required changes:**
  - Make `heroBlock.subheading` (Intro) required
  - Make the existing `heroMedia: mediaBox` field required
  - Update `Hero.astro` to render image or video based on media type
- **Acceptance:** Homepage can render full-bleed hero with headline, intro, and background image or video per signed Figma

### Home-Zine (required)

- **Status:** Unbuilt; spec exists in [home-zine.md](./home-zine.md)
- **Required changes:**
  - Implement against the current Issue contract in the [Zine companion specification](./zine-implementation-spec.md) and the authoritative [CMS Content Composition specification](./cms-content-composition-spec.md)
  - Add `homeZine` block to `homepage.sections[]` allowlist
  - Implement `HomeZine.astro` component with Issue reference, promo headline/intro/media/CTA
  - Fixed green brand color (`#99a224`)
  - Responsive: media left / text right on desktop; stacked on mobile
- **Acceptance:** Homepage can render Zine promo block linking to explicitly referenced Issue

### Capes (required)

- **Status:** Partially implemented; spec in [capes.md](./capes.md)
- **Required changes:**
  - Enforce maximum 6 Capabilities in `capesBlock`
  - Update `Capes.astro` to render the existing optional `capability.subtitle` below each title
- **Acceptance:** Homepage Capes section renders up to 6 Capabilities with title + subtitle per signed Figma

## Forms and user input

### Newsletter subscription

- **Route:** Embedded in Footer (site-wide) and potentially other page sections
- **Integration:** Email-only to Mailchimp via server endpoint
- **Fields:** Email address (required)
- **States:** Loading, success, duplicate (already subscribed), error
- **Behavior:**
  - Submit email via Astro endpoint `/api/newsletter/subscribe.json`
  - Endpoint calls Mailchimp API with server-side credentials
  - Return typed response: `{ success: true }` or `{ success: false, error: 'duplicate' | 'invalid' | 'network' }`
  - Display appropriate feedback message
  - Do NOT automatically subscribe contact form submissions to newsletter
- **Security:**
  - Vercel WAF endpoint rate limiting
  - Honeypot field (hidden, reject if filled)
  - Min-fill timing check (reject suspiciously fast submissions)
  - Strict email validation
- **Acceptance:** Newsletter form accepts email, subscribes to Mailchimp, displays success/error/duplicate states

### Contact form

- **Route:** Contact Band (site-wide, in Shared Site Shell)
- **Integration:** Store in Sanity as `formSubmission` document, route via Mailchimp (per ADR-0006)
- **Fields:** Inquiry Type, Name, Email, How Did You Hear About Us, and Message; all required
- **Behavior:**
  - Submit via the existing Astro endpoint `/api/contact`
  - Endpoint creates `formSubmission` document in Sanity
  - Endpoint creates a new Mailchimp contact with non-marketing `transactional` status (or preserves an existing contact's status), applies a `contact-form` tag, and emits the configured Mailchimp Customer Journey event used for the internal notification
  - Do NOT subscribe submitter to newsletter automatically
  - Return typed response: `{ success: true }` or `{ success: false, error: string }`
  - Display success/error feedback
- **Security:**
  - Same security measures as newsletter (WAF, honeypot, timing, validation)
  - Do NOT log PII in server logs or Sentry
  - Sanity `formSubmission` document stores data for editors to view in Studio
- **Acceptance:** Contact form submits, creates Sanity record, sends notification, displays feedback, does not subscribe to newsletter

## Site settings and configuration

### Site settings singleton

- **Schema:** `siteSettings` singleton
- **Fields:**
  - `instagramUrl` (required)
  - `linkedInUrl` (required)
  - `vimeoUrl` (required)
  - `youTubeUrl` (required)
- **Behavior:**
  - Footer social links query `siteSettings` and render links
  - Missing links omitted at runtime (but all required for launch)
  - Shop is an integrated route (`/shop`), not an external link in settings
- **Acceptance:** Footer renders social links from `siteSettings`; all four links required for launch

## Baseline SEO

### Meta tags and OpenGraph

- **Per-page derived metadata:**
  - `<title>`: derive from page-specific title (Case Study title, Article title, "Our Work", "Who We Are", "Zine", "Shop", "Home")
  - `<meta name="description">`: derive from page-specific summary or overview (Case Study summary, Article overview, page-specific fallback)
  - OG tags: `og:title`, `og:description`, `og:image` (use featured image or page-specific media), `og:url` (canonical)
  - Twitter Card tags: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **No custom SEO fields per content type in MVP**: editors do not override title/description/OG per document; all derived from existing content fields
- **Fallbacks:** site-wide default title suffix ("| Superbloom"), default OG image (Superbloom logo or homepage hero media)
- **Implementation:** add `<SEOHead>` component to all page layouts, accepting page-specific props

### Canonical URLs

- **Rules:**
  - All pages include `<link rel="canonical">` pointing to their canonical URL
  - Current Zine Issue at `/zine/issues/[slug]` redirects to `/zine` (canonical is `/zine`)
  - All other pages: canonical is their primary URL path
- **Implementation:** add `canonicalUrl` prop to `<Layout>` component; generate canonical link in head

### Sitemap

- **Route:** `/sitemap.xml`
- **Includes:**
  - Homepage `/`
  - Work index `/work`
  - All Case Studies `/work/[slug]`
  - Who We Are `/who-we-are`
  - Index Page `/index`
  - All News `/news/[slug]`
  - All Editorial Articles `/articles/[slug]`
  - Zine landing `/zine`
  - Zine Issue archives `/zine/issues/[slug]` (exclude current Issue)
  - All Zine Articles `/zine/issues/[issue-slug]/[article-slug]`
  - Shop `/shop`
  - All product pages `/shop/products/[handle]`
- **Excludes:**
  - Cart `/cart` (set `noindex`)
  - 404 page
  - API endpoints
  - Current Issue archive URL (because it redirects to `/zine`)
- **Implementation:** Astro endpoint `/sitemap.xml.ts` that queries all content and generates XML

### Robots.txt

- **Route:** `/robots.txt`
- **Content:**
  ```
  User-agent: *
  Allow: /
  
  Sitemap: https://superbloomhouse.com/sitemap.xml
  ```
- **Implementation:** static file or Astro endpoint

## 404 page

- **Route:** `/404.astro`
- **Content:**
  - Friendly error message: "Page not found"
  - Suggestion: "Try visiting our [homepage](/) or [our work](/work)"
  - Maintains Shared Site Shell (Navigation, Footer)
- **Behavior:**
  - Astro returns 404 status code
  - Page renders with site navigation intact (not a dead end)
- **Acceptance:** 404 page renders with Shared Site Shell, returns 404 status, provides navigation links

## Shared Site Shell final assembly

### Navigation

- **Status:** Partially implemented
- **Required changes:**
  - Add Shop link to main navigation
  - Add cart icon with badge count (cart line item count)
  - Ensure all nav links correct: Home `/`, Work `/work`, Who We Are `/who-we-are`, Index `/index`, Zine `/zine`, Shop `/shop`
  - Compact mobile menu uses the existing accessible collapsed-menu contract; no additional motion is authorized
  - Navigation accepts `role="surface"` to inherit foreground from parent surface
- **Acceptance:** Navigation renders all links, cart badge, and works on mobile

### Contact Band

- **Status:** Partially implemented
- **Required changes:**
  - Ensure Contact Band contains contact form (Name, Email, Message, Submit)
  - Contact Band Surface Role assigned by page template, not hardcoded
  - Approved page-specific mappings: Home → purple, Work → pink, Who We Are → blue, Index → green
  - Form submission creates Sanity `formSubmission` and routes notification
- **Acceptance:** Contact Band renders on all pages with page-appropriate color

### Footer

- **Status:** Partially implemented
- **Required changes:**
  - Social links from `siteSettings` (Instagram, LinkedIn, Vimeo, YouTube)
  - Newsletter subscription form
  - Main footer links: Work, Who We Are, Index, Zine, Shop; the logo remains the Home link
  - Shopify policy links: Privacy, Terms, Shipping, Refund (open in new tab)
  - Copyright notice uses the current year
- **Acceptance:** Footer renders social links, newsletter form, nav links, policy links, copyright

## Observability and monitoring

### Sentry integration

- **Setup:** Sentry SDK for Astro
- **Captures:**
  - JavaScript errors client-side
  - Server errors (route failures, API endpoint errors)
  - Performance traces (page load, API latency)
  - Structured logs for critical operations (form submission, cart operations, Shopify API errors)
- **PII redaction:**
  - Do NOT log customer email, phone, address, payment info
  - Redact form submission content (log submission ID only)
  - Redact cart details, including the capability-bearing cart ID and line items
  - Safe to log: Shopify product IDs, variant IDs, API error codes, HTTP status codes
- **Alerts:** Configure Sentry to alert Discord on critical errors (API auth failures, Shopify unreachable, form submission failures)
- **Acceptance:** Sentry captures errors, no PII in logs, Discord alerts on critical errors

## Content readiness

### Required demo content

Manual Studio content upload required before launch QA:

- **Homepage:**
  - Complete Home Hero (headline, intro, media)
  - Home-Zine block (promo for Issue)
  - Capes block (up to 6 Capabilities with subtitles)
- **Work:**
  - 5 Case Studies with complete Spine, colors, Press, Next Project
- **Who We Are:**
  - Complete page content (facts, FAQs, disciplines, marquee)
- **Index Page:**
  - Published Articles across the needed `news`, `editorial`, and `zine` types
  - Index Page Featured section manually curated with 1-4 fully configured unique cards
  - Enough non-Featured Articles to verify All-section sorting and progressive pagination
- **Zine:**
  - Current and archived Issues with ordered Zine Article memberships
  - Zine landing current Issue selected
  - Exactly one reading format per Issue: ISSUU URL or PDF asset
- **Shop:**
  - 4 Shopify products:
    - Single variant product
    - Multi-variant product (size + color)
    - Sold-out product
    - Discounted product
- **Site Settings:**
  - All four social links (Instagram, LinkedIn, Vimeo, YouTube)
  - Capability documents with subtitles
  - Tag taxonomy with sample tags

No committed content fixtures; manual upload session required.

### Dead link elimination

Before launch, verify no dead links:

- All internal links resolve to valid routes
- All external links tested (social, policy pages, external coverage)
- Case Study Next Project references valid Case Studies
- Related items references valid documents
- Every published Zine Article is referenced by exactly one valid Issue
- Index Page Featured references valid shared Articles and excludes duplicates

## Responsive, accessibility, performance QA

### Responsive verification

Test all pages at:
- Desktop (1440px)
- Compact (768–1023px)
- Small (<768px, test at 375px)

Verify:
- No horizontal overflow
- Readable text at all sizes
- Interactive controls accessible at all sizes
- Card grids stack appropriately
- Media maintains aspect ratios
- Navigation works on mobile

### Accessibility verification

- All images have alt text
- All interactive controls keyboard-operable
- Focus visible on all controls
- Form errors announced to screen readers
- Landmark regions correctly labeled
- Headings follow logical hierarchy
- Color contrast meets WCAG AA (warn on failures, allow editor override)
- External links indicate new-tab behavior
- Reduced motion respected (scroll, transitions)

### Performance verification

- Lighthouse score ≥90 on key pages (Home, Work, Case Study, Article Detail)
- Largest Contentful Paint <2.5s
- Cumulative Layout Shift <0.1
- Interaction to Next Paint <200ms
- Images lazy-loaded below fold
- Videos paused when not visible
- No render-blocking resources

### Browser QA

Test on:
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

Verify:
- Page loads without errors
- Forms submit correctly
- Videos play correctly
- Navigation works
- Cart persists correctly

## Implementation sequence

1. Complete homepage gaps (Hero media support, Home-Zine after Zine schema, Capes subtitle)
2. Implement newsletter subscription form and endpoint
3. Implement contact form submission and Sanity storage
4. Add `siteSettings` singleton and Footer social links
5. Implement baseline SEO (meta tags, OG, canonical, sitemap, robots.txt)
6. Build 404 page
7. Finalize Shared Site Shell (Navigation with Shop/cart, Contact Band, Footer with all links)
8. Set up Sentry with PII redaction and Discord alerts
9. Complete manual content upload (demo dataset per checklist)
10. Run dead link verification
11. Run responsive QA (desktop, compact, mobile)
12. Run accessibility QA (keyboard, screen reader, contrast, reduced motion)
13. Run performance QA (Lighthouse, LCP, CLS, INP)
14. Run browser QA (Chrome, Safari, Firefox, mobile)
15. Final launch-readiness review

## Acceptance criteria (umbrella)

- Homepage renders complete: Hero, Home-Zine, Capes (max 6, with subtitles)
- Newsletter form subscribes to Mailchimp with success/error/duplicate states
- Contact form creates Sanity record, sends notification, does not subscribe to newsletter
- Footer renders social links from `siteSettings`, newsletter form, nav links, policy links
- All pages have derived meta tags, OG tags, canonical URLs
- Sitemap includes all content routes, excludes current Issue archive
- Robots.txt allows crawling and references sitemap
- 404 page renders with Shared Site Shell and navigation
- Sentry captures errors without PII, alerts Discord on critical errors
- All required demo content uploaded and verified
- No dead links (internal or external)
- All pages responsive at desktop, compact, mobile
- All pages accessible (keyboard, screen reader, contrast, reduced motion)
- All pages performant (Lighthouse ≥90)
- All pages work in Chrome, Safari, Firefox, mobile browsers

## Validation

Run from the repository root:

```sh
pnpm typegen
pnpm --filter @superbloom/schemas test
pnpm --filter web astro check
pnpm --filter web build
pnpm --filter studio build
```

Then manually verify:
- All homepage blocks render correctly
- Forms submit and display feedback
- Footer links work (social, nav, policy)
- Sitemap generates correctly
- 404 page renders
- Sentry logs errors (test with intentional error)
- All demo content displays correctly
- Responsive layouts at all breakpoints
- Accessibility with keyboard and screen reader
- Performance with Lighthouse
- Cross-browser functionality

Track Shop visual design as a separate specification and approval stream; this functional spec does not close that work.
