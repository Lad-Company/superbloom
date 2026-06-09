# Sanity as CMS

Sanity is the content platform for all editorial content, image assets, and the editor workflow. The decisive factor over alternatives (Directus, Payload, Contentful) is the `sanity-plugin-mux-input` plugin and Sanity Connect for Shopify — editors get one surface for content, video uploads, and Shopify product extensions. The Gutenberg → PortableText conversion path is well-established for the eventual content migration.

**Considered options**: Sanity, Directus, Payload CMS, Contentful
**Why not Directus**: Simpler mental model for devs but worse for editors and has no first-party Shopify or Mux integration.
**Data sovereignty**: Sanity Content Lake is AWS-backed multi-region SaaS. Confirmed acceptable (SOC2-to-SOC2 vendor delegation).

**Datasets**: A single `production` dataset with Sanity's built-in drafts. Vercel preview deployments read drafts via a cookie-flipped preview endpoint (Sanity's Visual Editing pattern). No `staging` dataset — the editor experimentation surface is drafts, not a parallel dataset.
