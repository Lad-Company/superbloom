import {DEFAULTS, type CardWidth, type InfoPosition, type MediaAspectRatio} from './cardSettings'

type Reference = {_ref: string; _type?: 'reference'; _weak?: boolean}
type CardSettings = {
  cardWidth?: CardWidth
  mediaAspectRatio?: MediaAspectRatio
  infoPosition?: InfoPosition
}
type AllSection = {listDefaults?: CardSettings; [key: string]: unknown}

export type LegacyIndexPage = {
  lead?: Reference
  secondary?: Reference[]
  featured?: unknown[]
  allSection?: AllSection
}

function referenceFor(article: Reference): Reference {
  return {
    _type: 'reference',
    _ref: article._ref,
    ...(article._weak ? {_weak: true} : {}),
  }
}

function isReference(value: unknown): value is Reference {
  return Boolean(value && typeof value === 'object' && typeof (value as Reference)._ref === 'string')
}

function legacyFeaturedArticles(page: LegacyIndexPage): Reference[] {
  const seen = new Set<string>()

  return [page.lead, ...(page.secondary ?? [])].flatMap((article) => {
    if (!isReference(article) || seen.has(article._ref) || seen.size === 4) return []
    seen.add(article._ref)
    return [referenceFor(article)]
  })
}

export function migrateLegacyIndexPage(page: LegacyIndexPage) {
  const legacyItems = legacyFeaturedArticles(page)
  const allSection = page.allSection ?? {}

  return {
    featured:
      Array.isArray(page.featured) && page.featured.length > 0
        ? page.featured
        : legacyItems.map((article, index) => ({
            _key: `migrated-featured-${index + 1}`,
            _type: 'featuredCard',
            article,
            ...DEFAULTS,
          })),
    allSection: {
      ...allSection,
      listDefaults: {...DEFAULTS, ...allSection.listDefaults},
    },
  }
}
