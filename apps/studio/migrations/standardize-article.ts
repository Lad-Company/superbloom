import {writeFileSync} from 'node:fs'
import {getCliClient} from 'sanity/cli'

/**
 * Standardizes Articles to the single-article-type model:
 * - Preserves existing publicationDate values (now the frozen, auto-stamped field).
 * - Maps primary externalCoverage link to destination (url) + source (outlet).
 * - Backs up, then deletes, internal News articles with no external URL.
 * - Unsets legacy news fields (externalCoverage, cardDestination, leadMedia,
 *   body, relatedItems) from remaining News articles.
 * - Warns about articles with more than one manual tag (editor trims).
 *
 * Idempotent. Run with --dry-run to review the report without writing.
 */

type CoverageLink = {outlet?: string; url?: string; isPrimary?: boolean}

type ArticleDoc = {
  _id: string
  title?: string
  articleType?: string
  publicationDate?: string
  destination?: string
  source?: string
  externalCoverage?: CoverageLink[]
  cardDestination?: string
  hasLeadMedia?: boolean
  hasBody?: boolean
  hasRelatedItems?: boolean
  tagCount?: number
}

const client = getCliClient({apiVersion: '2026-07-22'}).withConfig({perspective: 'raw'})
const dryRun = process.argv.includes('--dry-run')

const articleProjection = `{
  _id,
  title,
  articleType,
  publicationDate,
  destination,
  source,
  externalCoverage,
  cardDestination,
  "hasLeadMedia": defined(leadMedia),
  "hasBody": defined(body),
  "hasRelatedItems": defined(relatedItems),
  "tagCount": count(tags)
}`

const [published, drafts] = await Promise.all([
  client.fetch<ArticleDoc[]>(`*[_type == "article" && !(_id in path("drafts.**"))]${articleProjection}`),
  client.fetch<ArticleDoc[]>(`*[_type == "article" && _id in path("drafts.**")]${articleProjection}`),
])
const articles = [...published, ...drafts]

const baseId = (id: string) => id.replace(/^drafts\./, '')

const patches: Array<{id: string; set: Record<string, unknown>; unset: string[]}> = []
const deletions: ArticleDoc[] = []
const warnings: string[] = []
let preservedDates = 0

for (const article of articles) {
  if (article.publicationDate) preservedDates += 1

  if ((article.tagCount ?? 0) > 1) {
    warnings.push(
      `"${article.title ?? article._id}" (${article._id}) has ${article.tagCount} tags; the new cap is 1. Trim manually in the Studio.`,
    )
  }

  if (article.articleType !== 'news') continue

  const legacyPresent = [
    ...(article.externalCoverage?.length ? ['externalCoverage'] : []),
    ...(article.cardDestination ? ['cardDestination'] : []),
    ...(article.hasLeadMedia ? ['leadMedia'] : []),
    ...(article.hasBody ? ['body'] : []),
    ...(article.hasRelatedItems ? ['relatedItems'] : []),
  ]

  const links = (article.externalCoverage ?? []).filter((link) => link?.url)
  const primary = links.find((link) => link.isPrimary) ?? links[0]

  if (!article.destination && !primary?.url) {
    // Only delete legacy-shaped docs (carrying cardDestination/externalCoverage,
    // or published under the old schema). A fresh in-progress news draft that
    // simply has no destination yet is left untouched. GROQ projections return
    // null for absent fields, so compare against null.
    const isLegacy =
      article.cardDestination != null ||
      article.externalCoverage != null ||
      Boolean(article.publicationDate)
    if (isLegacy) {
      deletions.push(article)
    } else {
      warnings.push(
        `"${article.title ?? article._id}" (${article._id}) is news without a destination URL but has no legacy fields; leaving it untouched.`,
      )
    }
    continue
  }

  const set: Record<string, unknown> = {}
  if (!article.destination && primary?.url) {
    set.destination = primary.url
    if (primary.outlet && !article.source) set.source = primary.outlet
  }

  if (Object.keys(set).length > 0 || legacyPresent.length > 0) {
    patches.push({id: article._id, set, unset: legacyPresent})
  }
}

// Expand deletions to cover both draft and published variants, keeping only
// ids that actually exist in the dataset.
const fetchedIds = new Set(articles.map((article) => article._id))
const deletionIds = new Set<string>()
for (const article of deletions) {
  deletionIds.add(baseId(article._id))
  deletionIds.add(`drafts.${baseId(article._id)}`)
}
const existingDeletionIds = [...deletionIds].filter((id) => fetchedIds.has(id))

console.log(`Scanned ${articles.length} article document(s) (published + drafts).`)
console.log(`- ${preservedDates} already have a publicationDate (kept as the frozen value).`)
console.log(`- ${patches.length} news document(s) to map destination/source and strip legacy fields.`)
console.log(`- ${deletions.length} internal news document(s) without an external URL to delete.`)

for (const article of deletions) {
  console.log(`  DELETE ${article._id}: ${article.title ?? 'Untitled'}`)
  const referencing = await client.fetch<Array<{_id: string; _type: string; title?: string}>>(
    `*[references($id) && !(_id in path("drafts.**")) && _id != $id]{_id, _type, title}`,
    {id: baseId(article._id)},
  )
  for (const ref of referencing) {
    console.log(`    ! still referenced by ${ref._type} "${ref.title ?? ref._id}" (${ref._id})`)
  }
}

for (const warning of warnings) console.log(`  WARN ${warning}`)

if (dryRun) {
  console.log('Dry run complete. No documents were changed or deleted.')
  process.exit(0)
}

if (deletions.length > 0) {
  const fullDocs = await client.fetch<Array<Record<string, unknown>>>(
    `*[_type == "article" && _id in $ids]`,
    {ids: existingDeletionIds},
  )
  const backupPath = new URL(
    `../backup-deleted-internal-news-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    import.meta.url,
  )
  writeFileSync(backupPath, JSON.stringify(fullDocs, null, 2))
  console.log(`Backed up ${fullDocs.length} document(s) to ${backupPath.pathname}`)
}

const transaction = client.transaction()
for (const {id, set, unset} of patches) {
  transaction.patch(id, (patch) => {
    let next = patch
    if (Object.keys(set).length > 0) next = next.set(set)
    if (unset.length > 0) next = next.unset(unset)
    return next
  })
}
for (const id of existingDeletionIds) {
  transaction.delete(id)
}

if (patches.length === 0 && existingDeletionIds.length === 0) {
  console.log('Nothing to migrate.')
} else {
  await transaction.commit()
  console.log(
    `Migrated ${patches.length} document(s); deleted ${existingDeletionIds.length} document(s).`,
  )
}
