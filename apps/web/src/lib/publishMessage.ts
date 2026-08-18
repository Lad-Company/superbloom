import {sanityClient} from './sanity'

// Renders Sanity publish webhook payloads as Discord messages (spec §4.3).
// The webhook's GROQ projection emits only _type/title/slug/articleType, so
// document bodies never leave Sanity.

// Allowlist of page-owning or page-affecting types (amended decision §2.5).
// `formSubmission` is deliberately excluded: those docs are API-created on
// every contact-form submission and contain PII.
export const ALLOWED_TYPES = new Set([
  'caseStudy',
  'article',
  'zineIssue',
  'homepage',
  'whoWeAre',
  'workIndex',
  'indexPage',
  'zineLanding',
  'siteSettings',
  'capability',
  'tag',
])

const TYPE_LABELS: Record<string, string> = {
  caseStudy: 'Case Study',
  zineIssue: 'Zine Issue',
  homepage: 'Homepage',
  whoWeAre: 'Who We Are',
  workIndex: 'Work Index',
  indexPage: 'Index Page',
  zineLanding: 'Zine Landing',
  siteSettings: 'Site Settings',
  capability: 'Capability',
  tag: 'Tag',
}

const ARTICLE_LABELS: Record<string, string> = {
  news: 'News Article',
  editorial: 'Editorial',
  zine: 'Zine Article',
}

// Singletons have no slug; they map to their fixed public path.
const SINGLETON_PATHS: Record<string, string> = {
  homepage: '/',
  whoWeAre: '/who-we-are',
  workIndex: '/work',
  indexPage: '/index',
  zineLanding: '/zine',
}

export interface PublishEvent {
  _type: string
  operation: string
  title?: string | null
  slug?: string | null
  articleType?: string | null
  issueSlug?: string | null
}

export function renderPublishMessage(event: PublishEvent): string | null {
  if (!ALLOWED_TYPES.has(event._type)) return null
  const label =
    event._type === 'article'
      ? (ARTICLE_LABELS[event.articleType ?? ''] ?? 'Article')
      : TYPE_LABELS[event._type]
  const title = event.title ? ` — '${event.title}'` : ''

  // Deletes/unpublishes get no link: the page is gone.
  if (event.operation === 'delete') {
    return `${label} unpublished or deleted${title}`
  }

  const path = resolvePath(event)
  const verb = event.operation === 'create' ? `New ${label} published` : `${label} updated`
  // With a title the path follows it ("· /work/x"); without one it attaches
  // directly to the verb line ("Homepage updated — /").
  return `${verb}${title}${path ? `${event.title ? ' · ' : ' — '}${path}` : ''}`
}

function resolvePath(event: PublishEvent): string | null {
  switch (event._type) {
    case 'caseStudy':
      return event.slug ? `/work/${event.slug}` : null
    case 'zineIssue':
      return event.slug ? `/zine/issues/${event.slug}` : null
    case 'article':
      if (event.articleType === 'zine') {
        return event.issueSlug && event.slug
          ? `/zine/issues/${event.issueSlug}/${event.slug}`
          : '/zine'
      }
      return event.slug ? `/articles/${event.slug}` : null
    default:
      return SINGLETON_PATHS[event._type] ?? null
  }
}

// Zine articles render at /zine/issues/{issue}/{article}, but issue membership
// lives on zineIssue.articles and webhook projections can't sub-query, so the
// relay resolves it here. Bypasses the CDN: the webhook fires the instant the
// article publishes, before the CDN has necessarily caught up.
export async function fetchZineIssueSlug(articleId: string): Promise<string | null> {
  return sanityClient
    .withConfig({useCdn: false})
    .fetch<string | null>(`*[_type == "zineIssue" && $articleId in articles[]._ref][0].slug.current`, {
      articleId,
    })
}

// Sanity delivery is at-least-once and deliveries carry an `idempotency-key`.
// Best-effort dedupe within a warm function instance (the relay holds no other
// state and keeps no copy of any payload, spec §5).
export function createIdempotencyCache(ttlMs = 10 * 60 * 1000) {
  const seen = new Map<string, number>()
  return (key: string, now = Date.now()): boolean => {
    for (const [k, timestamp] of seen) {
      if (now - timestamp > ttlMs) seen.delete(k)
    }
    if (seen.has(key)) return true
    seen.set(key, now)
    return false
  }
}
