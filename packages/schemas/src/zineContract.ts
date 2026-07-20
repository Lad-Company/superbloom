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
    )

  return existingIssueCount === 0 || 'One or more selected articles already belong to another Issue.'
}

export const validateIntroMediaExactlyFive = (media: unknown) => {
  if (!Array.isArray(media)) return 'Intro media must be an array.'
  return media.length === 5 || 'Intro media must contain exactly five items.'
}

export const validateIssueNumberPositive = (num: unknown) => {
  if (typeof num !== 'number') return 'Issue number must be a number.'
  return num > 0 || 'Issue number must be positive.'
}

export const validateIssueNumberUnique = async (num: unknown, context: ValidationContext) => {
  if (typeof num !== 'number' || !context.document?._id || !context.getClient) return true

  const documentId = context.document._id.replace(/^drafts\./, '')
  const existingIssueCount = await context
    .getClient({apiVersion: '2026-06-01'})
    .fetch(
      'count(*[_type == "zineIssue" && issueNumber == $issueNumber && !(_id in [$documentId, $draftId])])',
      {issueNumber: num, documentId, draftId: `drafts.${documentId}`},
    )

  return existingIssueCount === 0 || 'Issue number must be unique.'
}

export const validatePdfAsset = (asset: unknown) => {
  if (!asset) return 'PDF asset is required.'

  const ref =
    typeof asset === 'object' && asset !== null
      ? (asset as {asset?: {_ref?: string}; _ref?: string}).asset?._ref ??
        (asset as {_ref?: string})._ref
      : undefined

  return ref?.endsWith('-pdf') || 'Select a PDF file.'
}

export const validateEditorLetterComplete = (value: unknown) => {
  if (!value || typeof value !== 'object') return 'Editor letter is required.'
  const letter = value as Record<string, unknown>

  if (!letter.headline || typeof letter.headline !== 'string') {
    return 'Editor letter headline is required.'
  }

  if (!hasPortableTextContent(letter.body)) {
    return 'Editor letter body is required and must contain content.'
  }

  if (!letter.mediaBox) {
    return 'Editor letter media is required.'
  }

  return true
}
