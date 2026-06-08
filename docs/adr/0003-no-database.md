# No database

There is no application database (no Postgres, no Supabase, no SQLite). Every persistent concern is owned by a SaaS provider: content by Sanity, images by Sanity CDN, video by Mux, products and orders by Shopify, newsletter subscribers by Mailchimp, form submissions mirrored to Sanity as documents. The "backend" is ~200 LOC of glue endpoints in Astro.

Adding a database would introduce backups, schema migrations, secrets management, and uptime monitoring for zero benefit at this scale. If this constraint is ever revisited, the trigger would be a requirement that no SaaS in the current stack can satisfy.
