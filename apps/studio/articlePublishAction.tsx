import {useCallback, useState} from 'react'
import {
  getDraftId,
  useClient,
  useDocumentOperation,
  useValidationStatus,
  type DocumentActionComponent,
  type Path,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'
import {shouldRegenerateSlugAtPublish} from '@superbloom/schemas'

const API_VERSION = '2026-07-22'

/**
 * Resolve a validation marker path to human-readable field titles by walking
 * the schema (e.g. ["tags"] -> ["Tags"], ["body", 0, "blocks"] -> ["Body", ...]).
 */
const fieldTitlesForPath = (
  schemaType: {fields?: Array<{name: string; type?: unknown}>},
  path: Path,
  value: unknown,
): string[] => {
  const titles: string[] = []
  let currentType: any = schemaType
  let currentValue: any = value
  for (const segment of path) {
    if (typeof segment === 'string') {
      const field = currentType?.fields?.find((f: {name: string}) => f.name === segment)
      if (!field) break
      titles.push(field.type?.title || field.name)
      currentType = field.type
      currentValue = currentValue?.[segment]
    } else {
      const items: any[] = Array.isArray(currentValue) ? currentValue : []
      const index =
        typeof segment === 'number'
          ? segment
          : '_key' in segment
            ? items.findIndex((item) => item?._key === segment._key)
            : -1
      const item = index >= 0 ? items[index] : undefined
      const itemType =
        currentType?.of?.find((t: any) => t.name === item?._type) ?? currentType?.of?.[0]
      if (!itemType) break
      titles.push(itemType?.title || itemType?.name || `Item ${index + 1}`)
      currentType = itemType
      currentValue = item
    }
  }
  return titles
}

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
 * Publish action for Articles. Stamps publicationDate (when the editor left
 * it empty) and generates a scoped-unique slug from the title on first
 * publish. The slug stays frozen afterwards; publicationDate stays editable
 * so publishers can control card dates and sort order. Replaces the default
 * publish action so the hidden, required slug field does not block the very
 * publish that generates it.
 *
 * Duplicated articles arrive with the original's slug already set (Duplicate
 * copies the hidden field verbatim). On their first publish, a conflicting
 * slug is regenerated from the title instead of blocking; slugs of articles
 * that have been published before are never rewritten.
 */
export const articlePublishAction: DocumentActionComponent = (props) => {
  const {patch, publish} = useDocumentOperation(props.id, props.type)
  const client = useClient({apiVersion: API_VERSION}).withConfig({perspective: 'raw'})
  // Validate the draft, not the published snapshot: a bare id makes
  // useValidationStatus target the published document, so errors already
  // fixed in the draft would keep blocking publish. Sanity's own publish
  // action passes getDraftId(id) for the same reason.
  // `requirePublishedReferences: true` matches the default publish action:
  // publishing is blocked when the article references unpublished documents.
  const validationStatus = useValidationStatus(getDraftId(props.id), props.type, true)
  const {onFocus, onPathOpen, schemaType, value} = useDocumentPane()
  const [publishing, setPublishing] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  const draft = props.draft as ArticleDraft | null
  const willGenerateSlug = Boolean(draft?.title) && !draft?.slug?.current
  const blockingErrors = validationStatus.validation.filter(
    (marker) =>
      marker.level === 'error' && !(willGenerateSlug && marker.path[0] === 'slug'),
  )

  const revealField = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onFocus(path)
      setShowErrors(false)
    },
    [onFocus, onPathOpen],
  )

  const onHandle = useCallback(async () => {
    // A slug conflict on a never-published article means it was duplicated
    // from another article; heal it by regenerating from the title. Conflicts
    // on an already-published article still block (its URL is live).
    const slugConflicts = blockingErrors.filter((marker) => marker.path[0] === 'slug')
    const otherErrors = blockingErrors.filter((marker) => marker.path[0] !== 'slug')
    const canHealSlug = !props.published && Boolean(draft?.title) && Boolean(draft?.slug?.current)
    if (otherErrors.length > 0 || (slugConflicts.length > 0 && !canHealSlug)) {
      setShowErrors(true)
      return
    }

    setPublishing(true)
    try {
      const sets: Record<string, unknown> = {}
      if (!draft?.publicationDate) {
        sets.publicationDate = new Date().toISOString()
      }
      if (
        shouldRegenerateSlugAtPublish({
          hasTitle: Boolean(draft?.title),
          currentSlug: draft?.slug?.current,
          slugConflict: slugConflicts.length > 0,
          isFirstPublish: !props.published,
        })
      ) {
        sets.slug = {
          _type: 'slug',
          current: await uniqueScopedSlug(
            client,
            slugify(draft?.title ?? ''),
            draft?.articleType ?? 'editorial',
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
  }, [blockingErrors, client, draft, patch, publish, props])

  return {
    label: publishing ? 'Publishing…' : 'Publish',
    disabled: publishing || !props.draft || validationStatus.isValidating,
    onHandle,
    dialog: showErrors && {
      type: 'dialog',
      header: 'Fix validation errors before publishing',
      content: (
        <div>
          <p style={{marginTop: 0, color: 'var(--card-muted-fg-color)'}}>
            Select an error to jump to its field.
          </p>
          <ul style={{display: 'grid', gap: 12, listStyle: 'none', margin: 0, padding: 0}}>
            {blockingErrors.map((marker, index) => {
              const titles = fieldTitlesForPath(schemaType, marker.path, value)
              const label =
                titles.length > 0 ? `${titles.join(' › ')}: ${marker.message}` : marker.message
              if (marker.path.length === 0) return <li key={index}>{label}</li>
              return (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => revealField(marker.path)}
                    style={{
                      background: 'none',
                      border: 0,
                      color: 'inherit',
                      cursor: 'pointer',
                      font: 'inherit',
                      padding: 0,
                      textAlign: 'left',
                      textDecoration: 'underline',
                    }}
                  >
                    {label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ),
      onClose: () => setShowErrors(false),
    },
  }
}
