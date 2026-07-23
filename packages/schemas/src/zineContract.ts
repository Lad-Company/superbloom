type Reference = {_ref?: string}
type PortableTextBlock = {children?: Array<{text?: string}>}
type ValidationContext = {
  document?: {_id?: string; _type?: string}
  getClient?: (options: {apiVersion: string}) => {
    fetch: (query: string, params: Record<string, unknown>) => Promise<unknown>
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

export const validateArticlesMinOneAndUnique = (articles: unknown) => {
  if (!Array.isArray(articles)) return 'Articles must be an array.'
  if (articles.length < 1) return 'Issue must include at least one article.'

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
    ) as number

  return existingIssueCount === 0 || 'One or more selected articles already belong to another Issue.'
}

export const validateZineArticleIssueMembership = async (
  document: unknown,
  context: ValidationContext,
) => {
  const article = document as {_id?: string; articleType?: string} | undefined
  if (article?.articleType !== 'zine' || !article._id || !context.getClient) return true

  const articleId = article._id.replace(/^drafts\./, '')
  const issues = await context
    .getClient({apiVersion: '2026-06-01'})
    .fetch(
      '*[_type == "zineIssue" && references($articleId)]{_id, title}',
      {articleId},
    )
  const issueTitles = new Map<string, string>()
  for (const issue of issues as Array<{_id?: string; title?: string}>) {
    const issueId = issue._id?.replace(/^drafts\./, '')
    if (issueId) issueTitles.set(issueId, issue.title ?? issueId)
  }

  if (issueTitles.size === 1) return true

  const guidance = issueTitles.size > 0
    ? ` Found ${issueTitles.size}: ${[...issueTitles.values()].join(', ')}.`
    : ''
  return `Zine Articles must belong to exactly one Issue.${guidance}`
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

export const validateIssuuOrPdfRequired = (
  document?: {issuuUrl?: string; pdfAsset?: unknown},
) => {
  if (!document) return true
  const hasIssuu = !!document.issuuUrl
  const hasPdf = !!document.pdfAsset

  if (!hasIssuu && !hasPdf) {
    return 'Provide either an ISSUU URL or a PDF asset.'
  }

  if (hasIssuu && hasPdf) {
    return 'Provide either an ISSUU URL or a PDF asset, not both.'
  }

  return true
}
