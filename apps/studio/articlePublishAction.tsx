import {useCallback, useState} from 'react'
import {
  useClient,
  useDocumentOperation,
  useValidationStatus,
  type DocumentActionComponent,
} from 'sanity'

const API_VERSION = '2026-07-22'

type ArticleDraft = {
  title?: string
  articleType?: string
  slug?: {current?: string}
  publicationDate?: string
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled'

const uniqueScopedSlug = async (
  client: {fetch: (query: string, params: Record<string, string>) => Promise<(string | null)[]>},
  base: string,
  articleType: string,
  documentId: string,
): Promise<string> => {
  const publishedId = documentId.replace(/^drafts\./, '')
  const taken = new Set(
    (
      await client.fetch(
        `*[_type == "article" && articleType == $articleType && !(_id in [$publishedId, $draftId])].slug.current`,
        {articleType, publishedId, draftId: `drafts.${publishedId}`},
      )
    ).filter((slug): slug is string => Boolean(slug)),
  )

  if (!taken.has(base)) return base
  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

/**
 * Publish action for Articles. Stamps publicationDate and generates a
 * scoped-unique slug from the title on first publish; both stay frozen
 * afterwards. Replaces the default publish action so the hidden, required
 * slug field does not block the very publish that generates it.
 */
export const articlePublishAction: DocumentActionComponent = (props) => {
  const {patch, publish} = useDocumentOperation(props.id, props.type)
  const client = useClient({apiVersion: API_VERSION}).withConfig({perspective: 'raw'})
  // `requirePublishedReferences: true` matches the default publish action:
  // publishing is blocked when the article references unpublished documents.
  const validationStatus = useValidationStatus(props.id, props.type, true)
  const [publishing, setPublishing] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  const draft = props.draft as ArticleDraft | null
  const willGenerateSlug = Boolean(draft?.title) && !draft?.slug?.current
  const blockingErrors = validationStatus.validation.filter(
    (marker) =>
      marker.level === 'error' && !(willGenerateSlug && marker.path[0] === 'slug'),
  )

  const onHandle = useCallback(async () => {
    if (blockingErrors.length > 0) {
      setShowErrors(true)
      return
    }

    setPublishing(true)
    try {
      const sets: Record<string, unknown> = {}
      if (!draft?.publicationDate) {
        sets.publicationDate = new Date().toISOString()
      }
      if (draft?.title && !draft?.slug?.current) {
        sets.slug = {
          _type: 'slug',
          current: await uniqueScopedSlug(
            client,
            slugify(draft.title),
            draft.articleType ?? 'editorial',
            props.id,
          ),
        }
      }
      if (Object.keys(sets).length > 0) patch.execute([{set: sets}])
      publish.execute()
      props.onComplete()
    } finally {
      setPublishing(false)
    }
  }, [blockingErrors.length, client, draft, patch, publish, props])

  return {
    label: publishing ? 'Publishing…' : 'Publish',
    disabled: publishing || !props.draft || validationStatus.isValidating,
    onHandle,
    dialog: showErrors && {
      type: 'dialog',
      header: 'Fix validation errors before publishing',
      content: (
        <ul>
          {blockingErrors.map((marker, index) => (
            <li key={index}>{marker.message}</li>
          ))}
        </ul>
      ),
      onClose: () => setShowErrors(false),
    },
  }
}
