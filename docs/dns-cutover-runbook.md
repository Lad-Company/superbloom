# DNS Cutover Runbook — superbloomhouse.com

Cutover of superbloomhouse.com from the legacy Netlify site to the Vercel-hosted
Astro site. Launch: **2026-09-30**.

**Hosting context:** the Vercel project is on the Superbloom-owned **Pro** team
`superbloom` (project `superbloom`, `prj_qfcp4nlUHjOO1aIUpzsMb6jUhUdO`, root
directory `apps/web`, Node 24, transferred 2026-09-29). Production domains
`superbloomhouse.com` and `www.superbloomhouse.com` are assigned to the project;
production deploys are Ready.

**DNS context:** the registrar is **Domain.com** (Network Solutions). The
incumbent DNS zone is hosted at GoDaddy (`ns39/ns40.domaincontrol.com`) in an
account we do not control — we only have the zone export of 2026-09-28. The
cutover is therefore a **nameserver change at Domain.com to Vercel DNS**, with
the new zone fully recreated and verified beforehand.

## Strategy

Authoritative DNS moves from GoDaddy to Vercel DNS (zone on the `superbloom`
team). Because both the old zone (serving Netlify) and the new zone (serving
Vercel) answer correctly during propagation, the cutover has no downtime —
resolvers flip over individually over up to ~24–48h.

- 2026-09-24: a Vercel zone for the domain was pre-created on the `lad-company`
  team and populated from the zone export.
- 2026-09-30: zone moved to the `superbloom` team; missing records added;
  stale records dropped; full record-by-record verification against the live
  GoDaddy zone passed (see below).
- 2026-09-30: the legacy `toolnyc/superbloom` Vercel project was disconnected
  from this repo's Git integration (it was duplicating every build).

## Zone contents (Vercel, verified 2026-09-30)

Every record below was diffed against the live GoDaddy zone via
`dig @ns1.vercel-dns.com` and matched exactly.

| Record | Type | Value | Purpose |
| --- | --- | --- | --- |
| `@` | ALIAS (system) | `d83d9fd6daa04040.vercel-dns-017.com` | Apex → Vercel (replaces the Netlify A record) |
| `*` | ALIAS (system) | `cname.vercel-dns-017.com.` | Wildcard → Vercel; covers `www` |
| `@` | MX | Google Workspace (`aspmx.l.google.com` + 4 alternates) | Mail delivery |
| `send` | MX | `feedback-smtp.us-east-1.amazonses.com` (10) | SES return path *(added 2026-09-30)* |
| `@` | TXT ×10 | SPF + google-site-verification ×2, `MS=` ×2, apple/uber/openai verification, `rm_verify`, `ZOOM_verify_…` | SPF + third-party verifications |
| `dc-aa8e722993._spfm` | TXT | `v=spf1 include:_spf.google.com ~all` | SPF macro include |
| `send` | TXT | `v=spf1 include:amazonses.com ~all` | SES SPF *(added 2026-09-30)* |
| `_dmarc` | TXT | `v=DMARC1; p=none;` | DMARC |
| `google._domainkey` | TXT | `v=DKIM1; k=rsa; p=…` | Google Workspace DKIM |
| `k2._domainkey` / `k3._domainkey` | CNAME | `dkim2.mcsv.net.` / `dkim3.mcsv.net.` | Mailchimp DKIM |
| `resend._domainkey` | TXT | `p=…` | Resend DKIM *(added 2026-09-30)* |
| `@` | CAA ×3 | `pki.goog`, `sectigo.com`, `letsencrypt.org` | Vercel zone defaults |

### Dropped in the move (stale-record cleanup, 2026-09-30)

| Record | Was | Why dropped |
| --- | --- | --- |
| `api` A | `151.101.194.159` (Fastly/Flywheel) | Legacy WordPress-era host; only 301'd to the apex. Deleted per owner decision. Now caught by the wildcard ALIAS → Vercel 404. |
| `microsite` CNAME | `*.cloudfront.net` | Already dead (not resolving live). |
| 4× ACM validation CNAMEs | `*.acm-validations.aws` | Cert validations for the dead CloudFront microsites; nothing live depends on ACM certs. |
| `_domainconnect` CNAME | GoDaddy DomainConnect | GoDaddy-specific; meaningless on Vercel DNS. |

(`donwload.superbloom.com` in the export is a typo'd artifact on a *different*
domain, `superbloom.com`; it was never in this zone. Track separately if that
domain is ever in scope.)

## Cutover steps

1. At the **Domain.com** registrar, change the nameservers for
   `superbloomhouse.com` to:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
2. Vercel detects the delegation, marks the domain verified, and issues the
   SSL certificate automatically (minutes after delegation is visible).
3. Verify as propagation proceeds:
   ```sh
   dig +short superbloomhouse.com NS       # expect ns1/ns2.vercel-dns.com
   dig +short superbloomhouse.com A        # expect Vercel IPs (216.150.x.x)
   curl -sI https://www.superbloomhouse.com | head -5   # expect server: Vercel
   ```
4. Post-cutover:
   - [x] Studio preview default flipped to the prod hostname — a code change
     in `apps/studio/presentation.ts` (`initialOrigin`), not a Vercel env var.
     Typecheck clean; deployed 2026-09-30 (`sanity deploy` →
     superbloom-cms.sanity.studio).
   - [x] Sanity CORS: `https://www.superbloomhouse.com` allowlisted **with
     credentials** (browser-side preview/comlink requests from the prod
     origin).
   - [x] Sanity publish webhook repointed staging → prod. The hooks API has
     no update operation, so it was recreated as `discord-publish-relay`
     (identical filter/projection, same signing secret) and the old
     staging-URL hook was deleted.
   - [x] GitHub repo webhook (`deployment_status` → `api/hooks/github`)
     repointed to `https://www.superbloomhouse.com`.
   - Watch Discord `#site-alerts` / Sentry `sbh-web`.
   - Smoke-test: homepage, a Case Study, `/shop` cart flow, contact form
     (lands as a Sanity `formSubmission`), newsletter signup, draft preview
     from the Studio Presentation pane.

### Expected transition behavior: redirect loops

During propagation, a client with a **mixed cache** (apex resolved to Vercel,
`www` still cached to Netlify) hits a loop: Netlify 301s `www` → apex, Vercel
308s apex → `www`. It is transient (old record TTLs were 600s) and
self-heals; affected users can flush local DNS (`sudo dscacheutil
-flushcache; sudo killall -HUP mDNSResponder` on macOS) and clear the
browser's cached 301 (hard reload / incognito). The zero-risk alternative is
to temporarily disable Vercel's apex → www redirect until the old delegation
fully expires, then restore it.

## Rollback

The GoDaddy zone is untouched. To roll back, set the nameservers back to
`ns39.domaincontrol.com` / `ns40.domaincontrol.com` at Domain.com — the domain
immediately returns to the Netlify site. Decommission the Netlify site and the
old zone only after the new site has been stable for an agreed window.

## Open item (not a cutover blocker)

- **GA4 digest env vars are unset everywhere.** `GA4_PROPERTY_ID`,
  `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY` are empty in `.env.local` and absent
  from the Vercel project, so the daily traffic-digest cron returns 503 (and
  files a Sentry warning) until configured. Fill the values from the GA4 Data
  API service account, then `vercel env add <NAME> production --scope superbloom`.
