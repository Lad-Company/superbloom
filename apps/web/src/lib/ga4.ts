import {sign} from 'node:crypto'

// Minimal GA4 Data API client for the daily traffic digest (spec §4.4).
// Service-account auth via a JWT bearer grant; no Google client library.

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API_BASE = 'https://analyticsdata.googleapis.com/v1beta'
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const TOP_N = 3

let cachedToken: {token: string; expiresAt: number} | null = null

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token

  const now = Math.floor(Date.now() / 1000)
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsigned = `${encode({alg: 'RS256', typ: 'JWT'})}.${encode({
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  })}`
  // Vercel env vars may store the key with literal \n escapes.
  const key = privateKey.replace(/\\n/g, '\n')
  const signature = sign('RSA-SHA256', Buffer.from(unsigned), key).toString('base64url')

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Google token exchange failed with status ${response.status}`)

  const data = (await response.json()) as {access_token: string; expires_in: number}
  cachedToken = {token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000}
  return cachedToken.token
}

interface ReportRow {
  dimensionValues?: {value: string}[]
  metricValues?: {value: string}[]
}

async function runReport(propertyId: string, token: string, body: unknown): Promise<ReportRow[]> {
  const response = await fetch(`${API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`GA4 runReport failed with status ${response.status}`)
  const data = (await response.json()) as {rows?: ReportRow[]}
  return data.rows ?? []
}

export interface TrafficDigest {
  dateLabel: string
  users: string
  sessions: string
  topPages: [string, string][]
  topReferrers: [string, string][]
}

export async function fetchTrafficDigest(credentials: {
  propertyId: string
  clientEmail: string
  privateKey: string
}): Promise<TrafficDigest> {
  const token = await getAccessToken(credentials.clientEmail, credentials.privateKey)

  // The digest always covers the last completed UTC day, so Hobby-tier cron
  // drift (±59 min) shifts delivery, never content (spec §4.4). GA4 interprets
  // the dates in the property's timezone.
  const yesterday = new Date(Date.now() - 86_400_000)
  const date = yesterday.toISOString().slice(0, 10)
  const dateRange = {startDate: date, endDate: date}

  const [totals, pages, referrers] = await Promise.all([
    runReport(credentials.propertyId, token, {
      dateRanges: [dateRange],
      metrics: [{name: 'activeUsers'}, {name: 'sessions'}],
    }),
    runReport(credentials.propertyId, token, {
      dateRanges: [dateRange],
      dimensions: [{name: 'pagePath'}],
      metrics: [{name: 'screenPageViews'}],
      orderBys: [{metric: {metricName: 'screenPageViews'}, desc: true}],
      limit: TOP_N,
    }),
    runReport(credentials.propertyId, token, {
      dateRanges: [dateRange],
      dimensions: [{name: 'sessionSource'}],
      metrics: [{name: 'sessions'}],
      orderBys: [{metric: {metricName: 'sessions'}, desc: true}],
      limit: TOP_N,
    }),
  ])

  // "Mon Aug 17" — formatToParts to avoid the en-US comma after the weekday.
  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
      .formatToParts(yesterday)
      .map((part) => [part.type, part.value]),
  )

  return {
    dateLabel: `${dateParts.weekday} ${dateParts.month} ${dateParts.day}`,
    users: totals[0]?.metricValues?.[0]?.value ?? '0',
    sessions: totals[0]?.metricValues?.[1]?.value ?? '0',
    topPages: pages.map((row) => [
      row.dimensionValues?.[0]?.value ?? '?',
      row.metricValues?.[0]?.value ?? '0',
    ]),
    topReferrers: referrers.map((row) => [
      cleanReferrer(row.dimensionValues?.[0]?.value ?? '?'),
      row.metricValues?.[0]?.value ?? '0',
    ]),
  }
}

function cleanReferrer(source: string): string {
  if (source === '(direct)') return 'direct'
  if (source === '(not set)') return 'other'
  return source
}

export function renderDigest(digest: TrafficDigest): string {
  const pages = digest.topPages.map(([path, views]) => `${path} (${views})`).join(', ') || 'none'
  const referrers =
    digest.topReferrers.map(([source, count]) => `${source} (${count})`).join(', ') || 'none'
  return `Traffic — ${digest.dateLabel}: ${digest.users} users · ${digest.sessions} sessions · Top: ${pages} · Referrers: ${referrers}`
}
