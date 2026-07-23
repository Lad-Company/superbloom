type Reference = {_ref?: string}
type PortableTextBlock = {children?: Array<{text?: string}>}
type ValidationContext = {
  document?: {_id?: string; _type?: string; articleType?: string; externalCoverage?: unknown[]}
  parent?: {articleType?: string; cardDestination?: string}
}

const hasPortableTextContent = (value: unknown) =>
  Array.isArray(value) &&
  value.some((block: PortableTextBlock) =>
    block.children?.some((child) => Boolean(child.text?.trim())),
  )

export const validateArticleBody = (body: unknown, context: ValidationContext) => {
  if (Array.isArray(body) && body.length > 0) return true

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
  if (
    context.parent?.articleType &&
    context.parent.articleType !== 'news' &&
    Array.isArray(coverage) &&
    coverage.length > 0
  ) {
    return 'External coverage is only available for News.'
  }

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

export const validateScopedSlugUniqueness = async (
  slug: {current?: string},
  context: {
    getClient: (arg: {apiVersion: string}) => {
      fetch: (query: string, params: Record<string, string>) => Promise<number>
    }
    document?: {_id?: string; articleType?: string}
  },
): Promise<string | boolean> => {
  if (!slug?.current) return true

  const client = context.getClient({apiVersion: '2026-07-22'})
  const publishedId = context.document?._id?.replace(/^drafts\./, '')
  const articleType = context.document?.articleType

  if (!articleType || !publishedId) return true

  const query = `count(*[
    _type == "article" &&
    articleType == $articleType &&
    slug.current == $slugValue &&
    !(_id in [$publishedId, $draftId])
  ])`

  const result = await client.fetch(query, {
    articleType,
    slugValue: slug.current,
    publishedId,
    draftId: `drafts.${publishedId}`,
  })
  return result === 0 || `Slug already exists for article type "${articleType}".`
}