import {validateContentDefaultsCompleteness, validateFeaturedCardFullyConfigured} from './cardSettingsContract'

type Reference = {_ref?: unknown; article?: Reference}
type FeaturedCard = {article?: Reference; cardWidth?: string; mediaAspectRatio?: string; infoPosition?: string}

function referenceIds(items: unknown): string[] {
  if (!Array.isArray(items)) return []

  return items.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const ref = (item as FeaturedCard).article?._ref || (item as Reference)._ref
    return typeof ref === 'string' ? [ref] : []
  })
}

/**
 * Featured section must have 0-4 cards.
 */
export function validateIndexPageFeaturedCount(featured: unknown): string | boolean {
  if (!Array.isArray(featured)) return true
  if (featured.length > 4) return 'Featured section can contain at most 4 cards'
  return true
}

/**
 * Featured cards must be unique (no duplicate article references).
 */
export function validateIndexPageFeaturedCardsUnique(featured: unknown): string | boolean {
  if (!Array.isArray(featured)) return true

  const ids = referenceIds(featured)
  if (ids.length === 0) return true

  const uniqueIds = new Set(ids)
  return uniqueIds.size === ids.length || 'Featured cards must have unique articles'
}

/**
 * Featured cards must fully configure all three card settings.
 */
export function validateIndexPageFeaturedCardsFullyConfigured(cards: unknown[]): string | boolean {
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
export function validateIndexPageAllListDefaults(defaults: unknown): string | boolean {
  return validateContentDefaultsCompleteness(defaults)
}

export function validateIndexPageItemOverridesUnique(overrides: unknown): string | boolean {
  const ids = referenceIds(overrides)
  return new Set(ids).size === ids.length || 'Each Article can have only one item override'
}
