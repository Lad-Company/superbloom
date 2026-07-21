/**
 * Pure validators for Case Study Spine contract.
 * These functions are used in both schema validation and test assertions.
 */

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

function colorHex(color: unknown): unknown {
  if (typeof color === 'object' && color !== null && 'hex' in color) {
    return (color as {hex?: unknown}).hex
  }
  return color
}

export function isValidHexColor(color: unknown): boolean {
  const hex = colorHex(color)
  return typeof hex === 'string' && HEX_PATTERN.test(hex)
}

export function validateHexColor(color: unknown): string | boolean {
  return isValidHexColor(color) || 'Color must be a six-digit hex code (e.g., #fdd143)'
}

export function validateColorRequired(color: unknown): string | boolean {
  return validateHexColor(color)
}

export function validateSecondaryColorWithResults(
  context: {parent?: {secondaryColor?: unknown; results?: {backgroundColor?: string}}}
): string | boolean {
  const secondaryColor = context.parent?.secondaryColor
  const backgroundColor = context.parent?.results?.backgroundColor

  if (backgroundColor === 'secondary' && !isValidHexColor(secondaryColor)) {
    return 'Secondary Brand Color is required when Results uses the secondary background'
  }

  return true
}

export function validateCapabilitiesUnique(capabilities: unknown): string | boolean {
  if (!Array.isArray(capabilities)) return true
  const refs = capabilities.map((cap) => (cap && typeof cap === 'object' && '_ref' in cap ? cap._ref : null))
  const uniqueRefs = new Set(refs.filter(Boolean))
  return uniqueRefs.size === refs.filter(Boolean).length || 'Capabilities must be unique'
}

export function validateCapabilitiesCardinality(capabilities: unknown): string | boolean {
  if (!Array.isArray(capabilities)) return 'Capabilities must be an array'
  if (capabilities.length < 1 || capabilities.length > 6) {
    return 'Capabilities must contain 1–6 references'
  }
  return true
}

export function validatePressUnique(press: unknown): string | boolean {
  if (!Array.isArray(press)) return true
  const refs = press.map((item) => (item && typeof item === 'object' && '_ref' in item ? item._ref : null))
  const uniqueRefs = new Set(refs.filter(Boolean))
  return uniqueRefs.size === refs.filter(Boolean).length || 'Press references must be unique'
}

export function validatePressCardinality(press: unknown): string | boolean {
  if (!press) return true // optional, can be null/undefined
  if (!Array.isArray(press)) return 'Press must be an array'
  return press.length <= 3 || 'Press accepts at most three News references'
}

function normalizeDraftId(id: string): string {
  return id.replace(/^drafts\./, '')
}

export function validateNextProjectNotSelf(
  nextProject: unknown,
  context: {document?: {_id?: string}}
): string | boolean {
  if (!nextProject || typeof nextProject !== 'object' || !('_ref' in nextProject)) {
    return true // optional, can be empty
  }
  const nextProjectRef = (nextProject as {_ref?: string})._ref
  const currentId = context.document?._id
  if (nextProjectRef && currentId) {
    const normalizedRef = normalizeDraftId(nextProjectRef)
    const normalizedId = normalizeDraftId(currentId)
    if (normalizedRef === normalizedId) {
      return 'Next Project cannot reference the current document'
    }
  }
  return true
}

export function validateStatsCardinality(stats: unknown): string | boolean {
  if (!Array.isArray(stats)) return 'Stats must be an array'
  if (stats.length < 1 || stats.length > 4) {
    return 'Results accepts 1–4 complete stats'
  }
  return true
}

export function validateStatComplete(stat: unknown): string | boolean {
  if (!stat || typeof stat !== 'object') return 'Stat must be an object'
  const s = stat as Record<string, unknown>
  if (!s.value || typeof s.value !== 'string') return 'Stat value is required'
  if (!s.label || typeof s.label !== 'string') return 'Stat label is required'
  return true
}

export function validatePortableTextNonEmpty(portableText: unknown): string | boolean {
  if (!Array.isArray(portableText) || portableText.length === 0) {
    return 'This field is required and non-empty'
  }
  // Check if all blocks are empty
  const hasContent = portableText.some(
    (block) =>
      block &&
      typeof block === 'object' &&
      'children' in block &&
      Array.isArray((block as {children?: unknown[]}).children) &&
      ((block as {children?: unknown[]}).children as unknown[]).some(
        (child) =>
          child &&
          typeof child === 'object' &&
          'text' in child &&
          (child as {text?: string}).text?.trim()
      )
  )
  return hasContent || 'Content is required'
}
