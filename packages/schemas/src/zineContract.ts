type Reference = {_ref?: string}
type PortableTextBlock = {children?: Array<{text?: string}>}
type ValidationContext = {
  document?: {_id?: string; _type?: string; issueMode?: string}
  getClient?: (options: {apiVersion: string}) => {
    fetch: (query: string, params: Record<string, unknown>) => Promise<unknown>
  }
}

const hasPortableTextContent = (value: unknown) =>
  Array.isArray(value) &&
  value.some((block: PortableTextBlock) =>
    block.children?.some((child) => Boolean(child.text?.trim())),
  )

export const validatePortableTextNonEmpty = (value: unknown): true | string =>
  hasPortableTextContent(value) || 'This field is required.'

export const validateRelatedItems = (items: unknown, context?: ValidationContext): true | string => {
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

export const validateReferencesUnique = (items: unknown): true | string => {
  if (!Array.isArray(items)) return true
  const references = items.map((item: Reference) => item._ref).filter(Boolean)
  return new Set(references).size === references.length || 'References must be unique.'
}

export const validateArticlesMinOneAndUnique = (articles: unknown): true | string => {
  if (!Array.isArray(articles)) return 'Articles must be an array.'
  if (articles.length < 1) return 'Issue must include at least one article.'

  const references = articles.map((item: Reference) => item._ref).filter(Boolean)
  return new Set(references).size === references.length || 'Article references must be unique.'
}

export const validateArticlesNotInAnotherIssue = async (
  articles: unknown,
  context: ValidationContext,
): Promise<true | string> => {
  if (!Array.isArray(articles) || !context.document?._id || !context.getClient) return true

  const articleIds = articles.map((article: Reference) => article._ref).filter(Boolean)
  if (articleIds.length === 0) return true

  const documentId = context.document._id.replace(/^drafts\./, '')
  const existingIssueCount = (await context
    .getClient({apiVersion: '2026-06-01'})
    .fetch(
      'count(*[_type == "zineIssue" && !(_id in [$documentId, $draftId]) && references($articleIds)])',
      {articleIds, documentId, draftId: `drafts.${documentId}`},
    )) as number

  return existingIssueCount === 0 || 'One or more selected articles already belong to another Issue.'
}

export const validateZineArticleIssueMembership = async (
  document: unknown,
  context: ValidationContext,
): Promise<true | string> => {
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

export const validateIssuuUrl = (value: unknown): true | string => {
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

/** An issue flagged "ISSUU embed only" skips the full-treatment page and
   renders a minimal flipbook page at its archive URL. */
export const isEmbedOnlyIssue = (document: unknown): boolean =>
  (document as {issueMode?: string} | undefined)?.issueMode === 'embed'

/** Full-treatment fields (hero, letter, articles, list defaults) stay required
   for full issues but are waived for ISSUU-embed-only issues. */
export const validateFullIssueField = (
  value: unknown,
  context?: ValidationContext,
): true | string => {
  if (isEmbedOnlyIssue(context?.document)) return true
  return value ? true : 'Required for full issues.'
}

/** Full-treatment object fields hidden for ISSUU-embed-only issues. */
const FULL_TREATMENT_FIELDS = new Set([
  'heroMedia',
  'editorLetter',
  'articles',
  'listDefaults',
  'articleOverrides',
])

type FieldValidationContext = {document?: unknown; path?: unknown[]}

/** True when a validator runs inside a full-treatment field of an
   ISSUU-embed-only issue. Those fields are hidden, so their nested validation
   must not block publishing (hidden errors give editors no way to act).
   Visible fields like cardMedia are unaffected. */
export const isEmbedOnlyHiddenField = (context?: FieldValidationContext): boolean => {
  if (!isEmbedOnlyIssue(context?.document)) return false
  const root = Array.isArray(context?.path) ? context.path[0] : undefined
  return typeof root === 'string' && FULL_TREATMENT_FIELDS.has(root)
}
