type Reference = {_ref?: string}
type PortableTextBlock = {children?: Array<{text?: string}>}
type ValidationContext = {
  document?: {_id?: string; _type?: string; articleType?: string; externalCoverage?: unknown[]; isExternal?: boolean}
  parent?: {cardDestination?: string; isExternal?: boolean}
}

const hasPortableTextContent = (value: unknown) =>
  Array.isArray(value) &&
  value.some((block: PortableTextBlock) =>
    block.children?.some((child) => Boolean(child.text?.trim())),
  )

export const validateArticleBody = (body: unknown, context: ValidationContext) => {
  if (Array.isArray(body) && body.length > 0) return true

  // For unified article type, check articleType; fall back to _type for backward compatibility
  const type = context.document?.articleType ?? context.document?._type
  if (type === 'news' && (context.document?.externalCoverage?.length ?? 0) > 0) {
    return true
  }

  return type === 'news'
    ? 'Provide an article body or external coverage.'
    : 'An article body is required.'
}

export const validateNewsContent = (document: {body?: unknown; externalCoverage?: unknown[]} | undefined) => {
  if (Array.isArray(document?.body) && document.body.length > 0) return true
  if ((document?.externalCoverage?.length ?? 0) > 0) return true
  return 'Provide an article body or external coverage.'
}

export const validatePortableTextNonEmpty = (value: unknown) =>
  hasPortableTextContent(value) || 'This field is required.'

export const validateRelatedItems = (items: unknown, context?: ValidationContext) => {
  if (!Array.isArray(items) || items.length === 0) return true
  if (items.length !== 3) return 'Related items must be empty or contain exactly three items.'

  const references = items.map((item: Reference) => item._ref).filter(Boolean)
  if (new Set(references).size !== references.length) return 'Related items must be unique.'

  const currentId = context?.document?._id?.replace(/^drafts\./, '')
  if (currentId && references.some((reference) => reference?.replace(/^drafts\./, '') === currentId)) {
    return 'An article cannot be related to itself.'
  }

  return true
}

export const validateExternalCoverage = (coverage: unknown, context: ValidationContext) => {
  if (!Array.isArray(coverage)) return context.parent?.cardDestination === 'external'
    ? 'External cards require exactly one primary coverage link.'
    : true

  const primaryCount = coverage.filter((link: {isPrimary?: boolean}) => link.isPrimary).length
  if (context.parent?.cardDestination === 'external' && primaryCount !== 1) {
    return 'External cards require exactly one primary coverage link.'
  }

  return primaryCount <= 1 || 'Only one coverage link can be primary.'
}

export const validateReferencesUnique = (items: unknown) => {
  if (!Array.isArray(items)) return true
  const references = items.map((item: Reference) => item._ref).filter(Boolean)
  return new Set(references).size === references.length || 'References must be unique.'
}