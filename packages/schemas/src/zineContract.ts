type Reference = {_ref?: string}
type PortableTextBlock = {children?: Array<{text?: string}>}
type ValidationContext = {
  document?: {_id?: string; _type?: string}
  getClient?: (options: {apiVersion: string}) => {
    fetch: (query: string, params: Record<string, unknown>) => Promise<number>
  }
}

const hasPortableTextContent = (value: unknown) =>
  Array.isArray(value) &&
  value.some((block: PortableTextBlock) =>
    block.children?.some((child) => Boolean(child.text?.trim())),
  )

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

export const validateReferencesUnique = (items: unknown) => {
  if (!Array.isArray(items)) return true
  const references = items.map((item: Reference) => item._ref).filter(Boolean)
  return new Set(references).size === references.length || 'References must be unique.'
}

export const validateArticlesMinThreeAndUnique = (articles: unknown) => {
  if (!Array.isArray(articles)) return 'Articles must be an array.'
  if (articles.length < 3) return 'Issue must include at least three articles.'

  const references = articles.map((item: Reference) => item._ref).filter(Boolean)
  return new Set(references).size === references.length || 'Article references must be unique.'
}

export const validateArticlesNotInAnotherIssue = async (
  articles: unknown,
  context: ValidationContext,
) => {
  if (!Array.isArray(articles) || !context.document?._id || !context.getClient) return true

  const articleIds = articles.map((article: Reference) => article._ref).filter(Boolean)
  if (articleIds.length === 0) return true

  const documentId = context.document._id.replace(/^drafts\./, '')
  const existingIssueCount = await context
    .getClient({apiVersion: '2026-06-01'})
    .fetch(
      'count(*[_type == "zineIssue" && !(_id in [$documentId, $draftId]) && references($articleIds)])',
      {articleIds, documentId, draftId: `drafts.${documentId}`},
    )

  return existingIssueCount === 0 || 'One or more selected articles already belong to another Issue.'
}

export const validateIssuuUrl = (value: unknown) => {
  if (typeof value !== 'string' || !value) return 'ISSUU URL is required.'

  try {
    const url = new URL(value)
    return url.hostname === 'issuu.com' || url.hostname.endsWith('.issuu.com')
      ? true
      : 'Use an ISSUU publication or embed URL.'
  } catch {
    return 'Enter a valid ISSUU URL.'
  }
}
