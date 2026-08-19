# Observation Pipeline — Sentry Error Aggregation with a Discord Drain

Every operationally significant event on superbloomhouse.com — errors, deploys,
content publishes, and a daily traffic digest — surfaces as a sanitized,
human-readable message in Discord. Errors aggregate in Sentry first; everything
else flows through a thin relay in `apps/web`.

Decisions confirmed by interview on 2026-08-17. Code is source of truth for
implementation detail; this file records intent and the locked decisions.

---

## 0. Goal

Stakeholders (Pete, Lad Company) read one Discord server and know, without
opening a dashboard:

- when the site errors (new Sentry issues, deploy failures) — in
  **#site-alerts**;
- when the site changes (production deploys, content publishes) and how it
  performed yesterday (traffic digest) — in **#site-activity**.

Every message is sanitized (no PII, no secrets, no mention injection) and
human-readable (plain-language summary lines, not raw payloads).

## 1. Current state (facts)

- `apps/web` is Astro SSR on Vercel (`output: 'server'`, `@astrojs/vercel`;
  ARCHITECTURE.md §2). API glue already lives in `apps/web/src/pages/api/*`
  per ADR-0003 (no database; SaaS-owned persistence).
- The Vercel team is on the **Hobby plan**: no Account Webhooks, no Drains, no
  Audit Log Drains (all Pro/Enterprise; audit logs Enterprise-only). Cron jobs
  are available but limited to **once per day** with per-hour precision
  (±59 min).
- GA4 is live: measurement ID `G-M4H5NZVDCB`, Consent Mode v2, bootstrapped in
  `apps/web/src/layouts/Layout.astro`; preview traffic is excluded from prod
  analytics via `gaMode` (ADR-0026).
- No Sentry, Discord, or webhook-relay code or env vars exist anywhere in the
  repo today. `.env.local` (repo root, `envDir: '../..'`) holds only Mux,
  Mailchimp, Sanity, and Shopify keys.
- A Sentry organization for Pete's business already exists; the Discord
  integration installs at org level and becomes available to all projects in
  it.
- Vercel's GitHub app emits `deployment` / `deployment_status` events for
  every build on **any** plan; repo webhooks receive them.
- Sanity outgoing webhooks support GROQ filters **and projections** (the
  projection shapes the request payload at the source), a signing secret
  modeled on Stripe's standard, an `idempotency-key` header, and
  at-least-once delivery with two retries at 30-second intervals.
- Discord incoming webhooks are per-channel, unauthenticated-URL POSTs;
  message `content` caps at 2000 characters; `allowed_mentions` controls
  mention parsing. Discord's GitHub-compatible endpoint does **not** support
  `deployment` / `deployment_status` events, so deploys cannot use it.

## 2. Confirmed decisions (2026-08-17)

1. **Logins are out of scope.** The site has no visitor auth; admin-login
   events for Vercel/Sanity require Enterprise-tier audit features. Newsletter
   signups and form submissions were considered as a substitute and dropped.
2. **Traffic = a daily GA4 digest**, produced by a Vercel Cron job querying
   the GA4 Data API. No per-pageview streaming (Vercel Analytics drains are
   Pro-only and would be noise).
3. **Deploy events come from GitHub**, not Vercel: Hobby has no Account
   Webhooks, so the relay consumes GitHub `deployment_status` events emitted
   by Vercel's GitHub app.
4. **GitHub scope is deploys only.** No PR, issue, or push chatter.
5. **Sanity is the only additional upstream**: publish notifications. Amended
   2026-08-17 to cover every page-owning or page-affecting type, not just the
   three public content types: `caseStudy`, `article`, `zineIssue`, the page
   singletons (`homepage`, `whoWeAre`, `workIndex`, `indexPage`,
   `zineLanding`), `siteSettings`, `capability`, and `tag`. `formSubmission`
   is permanently excluded (API-created on every contact submission, contains
   PII); the webhook filter is an allowlist so future internal types never
   auto-notify. No Shopify orders, no Mux events.
6. **Two Discord channels**: `#site-alerts` (errors, deploy failures) and
   `#site-activity` (deploys, publishes, digest). Alerts never share a channel
   with ambient activity.
7. **Sentry aggregates errors and releases only.** All non-error events flow
   upstream → relay → Discord directly; nothing non-error is forced through
   Sentry.
8. **Sentry lives as a new project in the existing business org** — shared
   quota, org-level Discord integration reused, alert rules scoped to the new
   project.

## 3. Pipeline shape

```mermaid
flowchart LR
  GH[GitHub deploy events] -->|deployment_status| R[Relay /api/hooks]
  SAN[Sanity publish hook] --> R
  CRON[Vercel daily cron] --> GA[GA4 Data API]
  CRON --> R
  SDK[@sentry/astro SDK] -->|errors + releases| S[Sentry project]
  S -->|native Discord alert| AL[#site-alerts]
  R -->|deploy failure| AL
  R --> AC[#site-activity]
```

_Source of truth per event class:_

| Event class          | Aggregates in | Drains to      | Transport                                        |
| -------------------- | ------------- | -------------- | ------------------------------------------------ |
| Client/server errors | Sentry        | #site-alerts   | `@sentry/astro` SDK → Sentry Discord integration |
| Deploy success       | relay         | #site-activity | GitHub `deployment_status` webhook               |
| Deploy failure       | relay         | #site-alerts   | GitHub `deployment_status` webhook               |
| Content publish      | relay         | #site-activity | Sanity outgoing webhook                          |
| Traffic digest       | relay         | #site-activity | Vercel Cron → GA4 Data API                       |

## 4. Event catalog

Each entry describes behavior, not build steps. "Relay" means the endpoints in
§5; renderings are illustrative, not literal copy.

### 4.1 Errors (Sentry → #site-alerts)

- **Source:** browser and server runtimes of `apps/web`, captured by
  `@sentry/astro` (client and server init configs). The SDK supports Node
  runtimes only; the Vercel adapter's Lambda functions qualify, Edge runtime
  does not — the site uses no Edge runtime.
- **Aggregation:** Sentry groups events into issues. A new issue (or a
  regressed/spiking issue, per alert-rule tuning) triggers the org's Discord
  integration, which posts Sentry's own embed to `#site-alerts` and allows
  resolve/archive/assign from Discord for linked identities.
- **Sanitization:** Sentry's server-side data scrubbing stays enabled
  (default): values resembling credit cards and keys named like
  `password`/`secret`/`token`/`api_key`/`auth`/`credentials` are redacted.
  SDK-side, `dataCollection` restricts sending user data and HTTP bodies.
  Relay endpoints (§5) never attach request bodies to captured errors.
- **Releases:** each production build registers a Sentry release (named by the
  commit SHA) with source maps uploaded at build time, so Discord alert embeds
  link to readable stack traces and the deploy that introduced the issue.

### 4.2 Deploys (GitHub `deployment_status` → relay)

- **Source:** Vercel's GitHub app creates a GitHub Deployment per build; the
  repo webhook receives `deployment_status` events with `success` / `failure`
  / `error` states, the environment (`production` / `preview`), the commit
  SHA, and the deployment URL.
- **Filtering:** the relay acts on the `production` environment only. Preview
  deployment events are acknowledged and dropped — preview chatter would
  drown the channels.
- **Rendering:**
  - success → `#site-activity`: "Deploy succeeded — superbloomhouse.com ·
    `main@138ad15` · 1m 42s"
  - `failure` / `error` → `#site-alerts`: "Deploy FAILED — `main@02b30a3` ·
    build error · <logs link>"
- **Sanitization:** the relay reads an allowlist of fields (state,
  environment, SHA, URL, timestamps, creator login) and composes a new
  message; commit messages and payload bodies are never forwarded verbatim.

### 4.3 Content publishes (Sanity → relay)

- **Source:** one Sanity outgoing webhook on the `production` dataset,
  triggering on create/update/delete of **published** documents (drafts and
  versions are ignored by default; unpublish fires `delete`). The GROQ filter
  is the amended allowlist: `_type in ["caseStudy", "article", "zineIssue",
  "homepage", "whoWeAre", "workIndex", "indexPage", "zineLanding",
  "siteSettings", "capability", "tag"]`.
- **Payload shaping at the source:** the webhook's GROQ projection emits only
  what the message needs, so document bodies never leave Sanity. The operation
  arrives out-of-band in the `sanity-operation` header
  (`create`/`update`/`delete`), and fields are wrapped in
  `coalesce(after().…, before().…)` so delete/unpublish payloads still carry
  pre-delete values:

  ```
  {
    "_type":       coalesce(after()._type, before()._type),
    "title":       coalesce(after().title, before().title),
    "slug":        coalesce(after().slug.current, before().slug.current),
    "articleType": coalesce(after().articleType, before().articleType)
  }
  ```

  (Webhook projections support reference joins but not sub-queries.)
- **Rendering** → `#site-activity`: "New Case Study published — 'Brand X
  Campaign' · /work/brand-x" (update and delete/unpublish get their own
  plain-language lines; `article` renders with its `articleType` label).
  Singletons have no `title`/`slug`, so they render by type label with their
  fixed path ("Homepage updated — /"); `siteSettings`, `capability`, and
  `tag` render without a link.
- **Zine article links:** zine articles render at
  `/zine/issues/{issueSlug}/{articleSlug}`, but issue membership lives on
  `zineIssue.articles[]` and webhook projections cannot sub-query, so the
  relay runs one follow-up Sanity query for `articleType == "zine"`
  (`*[_type == "zineIssue" && $id in articles[]._ref][0].slug.current`) and
  falls back to `/zine` when unresolved (e.g. deletes).
- **Deduplication:** deliveries carry an `idempotency-key`; Sanity delivery is
  at-least-once, so the relay ignores repeat keys within a short window.

### 4.4 Daily traffic digest (Vercel Cron → GA4 Data API → relay)

- **Source:** the GA4 Data API `runReport` method against the numeric property
  behind measurement ID `G-M4H5NZVDCB`, authenticated with a service account
  (the `G-…` ID itself is not the API's property identifier).
- **Cadence:** one Vercel Cron job, daily. On Hobby the fire time drifts
  within a one-hour window; the digest always reports the last completed
  UTC day, so drift only shifts delivery, not content.
- **Content:** yesterday's active users and sessions, top pages by views, top
  referrers — one compact message to `#site-activity`:
  "Traffic — Mon Aug 16: 312 users · 401 sessions · Top: / (98), /work (54),
  /zine (31) · Referrers: google (120), direct (96)"
- **Failure:** if the GA4 query or the Discord post fails, the cron route
  reports the error to Sentry instead of posting a partial digest.

## 5. Relay behavior (`apps/web/src/pages/api/hooks/`)

The relay is thin Astro API glue, consistent with ADR-0003. It holds no state
and keeps no copy of any payload.

- **Endpoints:** `POST /api/hooks/github` (deployment_status), `POST
/api/hooks/sanity` (publishes), and the cron-invoked traffic-digest route.
- **Authentication of inbound calls:**
  - GitHub: HMAC-SHA-256 of the raw body in `X-Hub-Signature-256`, verified
    against `GITHUB_WEBHOOK_SECRET` with a timing-safe compare.
  - Sanity: the webhook secret signature (Stripe-style signing), verified
    against `SANITY_WEBHOOK_SECRET`.
  - Cron: `Authorization: Bearer ${CRON_SECRET}` header check.
  - Every other request gets a 401 and is otherwise ignored.
- **Sanitization by construction:** handlers extract a per-event allowlist of
  fields and compose a fresh Discord message. Raw upstream payloads are never
  forwarded, logged, or stored.
- **Discord posting:** every post sets `allowed_mentions: { "parse": [] }` so
  titles, SHAs, or commit authors can never trigger @mentions; content is
  truncated to Discord's 2000-character limit. The two channels are two
  incoming-webhook URLs (`DISCORD_ALERTS_WEBHOOK_URL`,
  `DISCORD_ACTIVITY_WEBHOOK_URL`).
- **Self-monitoring:** the relay runs inside `apps/web`, so its own failures
  (bad signatures excluded) are captured by the Sentry SDK like any other API
  route error. A failed Discord post surfaces as a Sentry issue in
  `#site-alerts` — the pipeline reports its own breakage.
- **Response contract:** 2xx only after the Discord post is accepted (or the
  event is intentionally dropped, e.g. preview deploys); 5xx otherwise, so
  Sanity/GitHub retry semantics apply.

## 6. Sentry configuration

- **Project:** one new project (Astro platform) in the existing business org.
  Plan quota is shared across the org; this site's volume is negligible
  against it.
- **SDK:** `@sentry/astro` with `sentry.client.config.ts` and
  `sentry.server.config.ts` at the `apps/web` root, registered as an Astro
  integration in `astro.config.mjs`.
- **Releases/source maps:** `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
  `SENTRY_PROJECT` set in the Vercel project (the Sentry–Vercel integration
  can provision these); the build uploads source maps and creates a release
  per deploy.
- **Scrubbing:** server-side data scrubbing left on with defaults; Additional
  Sensitive Fields extended if any Superbloom-specific key names appear;
  "prevent IP address storage" evaluated at setup against debugging value.
- **Discord alert rule:** for the new project, "new issue created" (plus
  regression/spike conditions as tuned) → Discord action → `#site-alerts`,
  addressed by channel ID. The Sentry bot must have access to the channel.

## 7. Environment variables

All live in the repo-root `.env.local` for dev (`envDir: '../..'`) and in the
Vercel project settings for deployed environments.

| Variable                                              | Purpose                                      |
| ----------------------------------------------------- | -------------------------------------------- |
| `SENTRY_DSN`                                          | SDK ingestion (client + server)              |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Release + source-map upload at build         |
| `DISCORD_ALERTS_WEBHOOK_URL`                          | Relay posts to #site-alerts                  |
| `DISCORD_ACTIVITY_WEBHOOK_URL`                        | Relay posts to #site-activity                |
| `GITHUB_WEBHOOK_SECRET`                               | `X-Hub-Signature-256` verification           |
| `SANITY_WEBHOOK_SECRET`                               | Sanity signature verification                |
| `CRON_SECRET`                                         | Bearer check on the cron route               |
| `GA4_PROPERTY_ID`                                     | Numeric GA4 property ID for `runReport`      |
| `GA4_CLIENT_EMAIL` / `GA4_PRIVATE_KEY`                | Service-account credentials for the Data API |

## 8. Plan-tier constraints (Hobby)

- No Vercel Account Webhooks, Drains, or Audit Log Drains — hence
  GitHub-sourced deploy events and no login/audit coverage. Upgrading to Pro
  later would allow swapping the deploy source to Vercel webhooks and adding
  Firewall attack events without changing the relay's Discord contract.
- Cron: maximum once per day, per-hour precision (±59 min) — matches the daily
  digest exactly; nothing in this design needs finer scheduling.
- Discord webhook execution is rate-limited per channel; this pipeline's
  volume (a handful of messages per day) is orders of magnitude below it.
- Sanity webhooks: one concurrent request, 30-second timeout, two retries at
  30-second intervals; the relay answers well within that budget.

## 9. Out of scope

- Login/sign-in tracking of any kind (dropped 2026-08-17).
- Newsletter signups and contact-form submissions as events.
- Shopify order notifications, Mux asset events, Mailchimp activity.
- GitHub PR/issue/push chatter; preview-deployment notifications.
- Real-time or per-pageview traffic streaming; spike/anomaly alerting.
- Uptime monitoring (no synthetic checks in this design).

## 10. References

- Sentry Astro SDK — https://docs.sentry.io/platforms/javascript/guides/astro/
- Sentry Discord integration — https://docs.sentry.io/organization/integrations/notification-incidents/discord/
- Sentry data scrubbing (server-side) — https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/
- Sentry–Vercel integration — https://docs.sentry.io/organization/integrations/deployment/vercel/
- Vercel Webhooks — https://vercel.com/docs/webhooks
- Vercel Drains — https://vercel.com/docs/drains
- Vercel Cron Jobs usage & pricing — https://vercel.com/docs/cron-jobs/usage-and-pricing
- Discord Webhook resource — https://discord.com/developers/docs/resources/webhook
- GitHub webhook events & payloads — https://docs.github.com/en/webhooks/webhook-events-and-payloads
- GitHub validating webhook deliveries — https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
- Sanity GROQ-powered webhooks — https://www.sanity.io/docs/content-lake/webhooks
- GA4 Data API (runReport) — https://developers.google.com/analytics/devguides/reporting/data/v1/basics
