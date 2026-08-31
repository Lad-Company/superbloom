import {validateContentDefaultsCompleteness} from './cardSettingsContract'

type Reference = {_ref?: unknown; article?: Reference}
type FeaturedCard = {article?: Reference}

function referenceIds(items: unknown): string[] {
  if (!Array.isArray(items)) return []

  return items.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const ref = (item as FeaturedCard).article?._ref || (item as Reference)._ref
    return typeof ref === 'string' ? [ref] : []
  })
}

/**
 * Featured section is either empty or holds one lead card plus 2-3 side
 * cards (3-4 total) — the layout locks one 3/4-width lead against a 1/4
 * rail, so anything between renders broken.
 */
export function validateIndexPageFeaturedCount(featured: unknown): true | string {
  if (!Array.isArray(featured)) return true
  if (featured.length === 0) return true
  if (featured.length < 3 || featured.length > 4) {
    return 'Featured section needs a lead card plus 2-3 side cards (3-4 cards total), or leave it empty'
  }
  return true
}

/**
 * Featured cards must be unique (no duplicate article references).
 */
export function validateIndexPageFeaturedCardsUnique(featured: unknown): true | string {
  if (!Array.isArray(featured)) return true

  const ids = referenceIds(featured)
  if (ids.length === 0) return true

  const uniqueIds = new Set(ids)
  return uniqueIds.size === ids.length || 'Featured cards must have unique articles'
}

/**
 * All section list defaults must be complete if present.
 */
export function validateIndexPageAllListDefaults(defaults: unknown): true | string {
  return validateContentDefaultsCompleteness(defaults)
}

export function validateIndexPageItemOverridesUnique(overrides: unknown): true | string {
  const ids = referenceIds(overrides)
  return new Set(ids).size === ids.length || 'Each Article can have only one item override'
}
