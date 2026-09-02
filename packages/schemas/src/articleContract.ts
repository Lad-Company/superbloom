type Reference = {_ref?: string}
type PortableTextBlock = {children?: Array<{text?: string}>}
type ValidationContext = {
  document?: {_id?: string; _type?: string; articleType?: string}
  parent?: unknown
}

const hasPortableTextContent = (value: unknown) =>
  Array.isArray(value) &&
  value.some((block: PortableTextBlock) =>
    block.children?.some((child) => Boolean(child.text?.trim())),
  )

// News links out to external coverage and carries no internal body (ADR-0033);
// Editorial and Zine detail pages still require one.
export const validateArticleBody = (
  body: unknown,
  context?: ValidationContext,
): true | string => {
  if (context?.document?.articleType === 'news') return true
  return Array.isArray(body) && body.length > 0 ? true : 'An article body is required.'
}

export const validatePortableTextNonEmpty = (value: unknown): true | string =>
  hasPortableTextContent(value) || 'This field is required.'

export const validateRelatedItems = (
  items: unknown,
  context?: ValidationContext,
): true | string => {
  if (!Array.isArray(items) || items.length === 0) return true
  if (items.length !== 3) return 'Related items must be empty or contain exactly three items.'

  const references = items.map((item: Reference) => item._ref).filter(Boolean)
  if (new Set(references).size !== references.length) return 'Related items must be unique.'

  const docId = (context?.document as {_id?: string; _type?: string} | undefined)?._id
  const currentId = docId?.replace(/^drafts\./, '')
  if (currentId && references.some((reference) => reference?.replace(/^drafts\./, '') === currentId)) {
    return 'An article cannot be related to itself.'
  }

  return true
}

export const validateReferencesUnique = (items: unknown): true | string => {
  if (!Array.isArray(items)) return true
  const references = items.map((item: Reference) => item._ref).filter(Boolean)
  return new Set(references).size === references.length || 'References must be unique.'
}

export const validateScopedSlugUniqueness = async (
  slug: {current?: string} | undefined,
  context: {
    getClient: (arg: {apiVersion: string}) => {
      fetch: (query: string, params: Record<string, string | string[]>) => Promise<number>
    }
    document?: {_id?: string; articleType?: string}
  },
): Promise<true | string> => {
  if (!slug?.current) return true

  const client = context.getClient({apiVersion: '2026-07-22'})
  const publishedId = context.document?._id?.replace(/^drafts\./, '')
  const articleType = context.document?.articleType

  if (!articleType || !publishedId) return true

  // News and Editorial share the /articles/[slug] route, so their slugs must
  // be unique across both types; Zine articles live under
  // /zine/issues/[issue]/[article] and scope to zine only.
  const scopeTypes = articleType === 'zine' ? ['zine'] : ['news', 'editorial']

  const query = `count(*[
    _type == "article" &&
    articleType in $scopeTypes &&
    slug.current == $slugValue &&
    !(_id in [$publishedId, $draftId])
  ])`

  const result = await client.fetch(query, {
    scopeTypes,
    slugValue: slug.current,
    publishedId,
    draftId: `drafts.${publishedId}`,
  })
  if (result === 0) return true
  return articleType === 'zine'
    ? 'Slug already exists for article type "zine".'
    : 'Slug already exists on a News or Editorial article.'
}

// The slug is frozen once an article is published (stable URLs). But Sanity's
// Duplicate action copies the hidden slug field verbatim, so a duplicated
// article arrives at its first publish holding the original's slug. Regenerate
// in that case instead of blocking; never touch a published article's slug.
export const shouldRegenerateSlugAtPublish = (options: {
  hasTitle: boolean
  currentSlug?: string
  slugConflict: boolean
  isFirstPublish: boolean
}): boolean =>
  options.hasTitle &&
  (!options.currentSlug || (options.slugConflict && options.isFirstPublish))