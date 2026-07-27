import {validateContentDefaultsCompleteness, validateFeaturedCardFullyConfigured} from './cardSettingsContract'

type Reference = {_ref?: unknown; caseStudy?: Reference}
type FeaturedCaseStudy = {caseStudy?: Reference; cardWidth?: string; mediaAspectRatio?: string; infoPosition?: string}

function referenceIds(items: unknown): string[] {
  if (!Array.isArray(items)) return []

  return items.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const ref = (item as FeaturedCaseStudy).caseStudy?._ref || (item as Reference)._ref
    return typeof ref === 'string' ? [ref] : []
  })
}

/**
 * Featured section must have 0-4 Case Studies.
 */
export function validateWorkIndexFeaturedCount(featured: unknown): true | string {
  if (!Array.isArray(featured)) return true
  if (featured.length > 4) return 'Featured section can contain at most 4 Case Studies'
  return true
}

/**
 * Featured Case Studies must be unique (no duplicate references).
 */
export function validateWorkIndexFeaturedCardsUnique(featured: unknown): true | string {
  if (!Array.isArray(featured)) return true

  const ids = referenceIds(featured)
  if (ids.length === 0) return true

  const uniqueIds = new Set(ids)
  return uniqueIds.size === ids.length || 'Featured Case Studies must be unique'
}

/**
 * Featured Case Studies must fully configure all three card settings.
 */
export function validateWorkIndexFeaturedCardsFullyConfigured(cards: unknown): true | string {
  if (!Array.isArray(cards)) return true

  for (const card of cards) {
    const validation = validateFeaturedCardFullyConfigured(card)
    if (validation !== true) return validation
  }

  return true
}

/**
 * All section list defaults must be complete if present.
 */
export function validateWorkIndexAllListDefaults(defaults: unknown): true | string {
  return validateContentDefaultsCompleteness(defaults)
}

export function validateWorkIndexItemOverridesUnique(overrides: unknown): true | string {
  const ids = referenceIds(overrides)
  return new Set(ids).size === ids.length || 'Each Case Study can have only one item override'
}
