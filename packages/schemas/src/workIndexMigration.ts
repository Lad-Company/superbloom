import {DEFAULTS, type CardWidth, type InfoPosition, type MediaAspectRatio} from './cardSettings'

export const MAX_FEATURED_CASE_STUDIES = 4

type Reference = {_ref: string; _type?: 'reference'; _weak?: boolean}

type CardSettings = {
  cardWidth?: CardWidth
  mediaAspectRatio?: MediaAspectRatio
  infoPosition?: InfoPosition
}

export type LegacyWorkCaseStudy = {
  _id: string
  orderRank?: string
  cardSize?: 'full' | 'half'
  cardAspectRatio?: MediaAspectRatio
} & CardSettings

export type LegacyWorkIndex = {
  featured?: unknown[]
  allSection?: {listDefaults?: CardSettings; [key: string]: unknown}
}

function referenceFor(caseStudy: LegacyWorkCaseStudy): Reference {
  return {_type: 'reference', _ref: caseStudy._id}
}

export function migrateLegacyWorkCard(caseStudy: LegacyWorkCaseStudy): Required<CardSettings> {
  return {
    cardWidth:
      caseStudy.cardWidth ??
      (caseStudy.cardSize === 'full' ? 'full' : DEFAULTS.cardWidth),
    mediaAspectRatio: caseStudy.mediaAspectRatio ?? caseStudy.cardAspectRatio ?? DEFAULTS.mediaAspectRatio,
    infoPosition: caseStudy.infoPosition ?? DEFAULTS.infoPosition,
  }
}

export function migrateLegacyWorkIndex(
  page: LegacyWorkIndex,
  rankedCaseStudies: LegacyWorkCaseStudy[],
) {
  const allSection = page.allSection ?? {}
  const seen = new Set<string>()
  const featured =
    Array.isArray(page.featured) && page.featured.length > 0
      ? page.featured
      : rankedCaseStudies.flatMap((caseStudy, index) => {
          if (
            !caseStudy.orderRank ||
            seen.has(caseStudy._id) ||
            seen.size === MAX_FEATURED_CASE_STUDIES
          )
            return []
          seen.add(caseStudy._id)

          return [
            {
              _key: `migrated-featured-${index + 1}`,
              _type: 'featuredCaseStudy',
              caseStudy: referenceFor(caseStudy),
              ...migrateLegacyWorkCard(caseStudy),
            },
          ]
        })

  return {
    featured,
    allSection: {
      ...allSection,
      listDefaults: {...DEFAULTS, ...allSection.listDefaults},
    },
  }
}
