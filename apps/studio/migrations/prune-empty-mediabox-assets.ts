import {writeFileSync} from 'node:fs'
import {getCliClient} from 'sanity/cli'

/**
 * Prunes corrupt mediaBox asset arrays and removes the duplicate editorial
 * article.
 *
 * Prune pass: the mediaBox schema requires exactly one asset, but some docs
 * (notably article-news-1's cardMedia) shipped with stray empty array members
 * ahead of the real asset. The web projection takes the first member that
 * references an asset, but the corrupt data itself is cleaned here: drop
 * members without an asset reference, keep the first member that has one.
 *
 * Deletion pass: removes the duplicate editorial copy of the 5th-Birthday
 * news story (f9698dcf-53b1-40a5-bff0-a8f92d2c6f98), backing it up first.
 * Skipped with a warning if anything still references it.
 *
 * Idempotent. Run with --dry-run to review the report without writing.
 */

const DUPLICATE_EDITORIAL_ID = 'f9698dcf-53b1-40a5-bff0-a8f92d2c6f98'

const client = getCliClient({apiVersion: '2026-07-22'}).withConfig({perspective: 'raw'})
const dryRun = process.argv.includes('--dry-run')

type Json = Record<string, unknown>

type Patch = {id: string; path: string; value: unknown}

const isRecord = (value: unknown): value is Json =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

const hasAssetRef = (member: unknown): boolean =>
  isRecord(member) && isRecord(member.asset) && typeof member.asset._ref === 'string'

/** Pruned mediaBox value, or null when nothing changes. */
const pruneMediaBox = (mediaBox: Json): Json | null => {
  const asset = mediaBox.asset
  if (!Array.isArray(asset) || asset.length === 0) return null

  const valid = asset.filter(hasAssetRef)
  const pruned = valid.slice(0, 1)
  if (pruned.length === asset.length) return null

  return {...mediaBox, asset: pruned}
}

const segmentToPath = (segment: string | {_key: string}): string =>
  typeof segment === 'string' ? segment : `[_key=="${segment._key}"]`

const collectPatches = (doc: Json): Patch[] => {
  const patches: Patch[] = []

  const walk = (node: unknown, path: Array<string | {_key: string}>) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        if (isRecord(item) && typeof item._key === 'string') {
          walk(item, [...path, {_key: item._key}])
        }
      }
      return
    }
    if (!isRecord(node)) return

    if (node._type === 'mediaBox') {
      const pruned = pruneMediaBox(node)
      if (pruned) {
        patches.push({
          id: doc._id as string,
          path: path.map(segmentToPath).join('.'),
          value: pruned,
        })
        return // pruned value replaces this subtree; no need to descend
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('_')) continue
      walk(value, [...path, key])
    }
  }

  for (const [key, value] of Object.entries(doc)) {
    if (key.startsWith('_')) continue
    walk(value, [key])
  }

  return patches
}

console.log('Scanning all documents (published + drafts) for corrupt mediaBox assets...')

const docs = await client.fetch<Json[]>(`*[!(_type match "system.*") && !(_type match "sanity.*")]`)
const patches: Patch[] = []
for (const doc of docs) {
  patches.push(...collectPatches(doc))
}

for (const patch of patches) {
  console.log(`  PRUNE ${patch.id} at ${patch.path}`)
}
console.log(`${patches.length} mediaBox field(s) to prune across ${docs.length} document(s).`)

// Duplicate editorial article: back up and delete, unless still referenced.
const referencing = await client.fetch<Array<{_id: string; _type: string; title?: string}>>(
  `*[references($id) && _id != $id]{_id, _type, title}`,
  {id: DUPLICATE_EDITORIAL_ID},
)

const deletionIds = [DUPLICATE_EDITORIAL_ID, `drafts.${DUPLICATE_EDITORIAL_ID}`]
const existingDeletionDocs = await client.fetch<Json[]>(`*[_id in $ids]`, {ids: deletionIds})

let skipDeletion = false
if (referencing.length > 0) {
  skipDeletion = true
  for (const ref of referencing) {
    console.log(
      `  WARN duplicate editorial ${DUPLICATE_EDITORIAL_ID} still referenced by ${ref._type} "${ref.title ?? ref._id}" (${ref._id}); skipping deletion.`,
    )
  }
}
if (existingDeletionDocs.length === 0) {
  skipDeletion = true
  console.log(`Duplicate editorial ${DUPLICATE_EDITORIAL_ID} not found; nothing to delete.`)
}

if (dryRun) {
  if (!skipDeletion) {
    console.log(
      `Would back up and delete ${existingDeletionDocs.length} document(s): ${existingDeletionDocs.map((doc) => doc._id).join(', ')}`,
    )
  }
  console.log('Dry run complete. No documents were changed or deleted.')
  process.exit(0)
}

const mutations: Array<Record<string, unknown>> = []
for (const patch of patches) {
  mutations.push({patch: {id: patch.id, set: {[patch.path]: patch.value}}})
}

if (!skipDeletion) {
  const backupPath = new URL(
    `../backup-duplicate-editorial-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    import.meta.url,
  )
  writeFileSync(backupPath, JSON.stringify(existingDeletionDocs, null, 2))
  console.log(`Backed up ${existingDeletionDocs.length} document(s) to ${backupPath.pathname}`)
  for (const doc of existingDeletionDocs) {
    mutations.push({delete: {id: doc._id as string}})
  }
}

if (mutations.length === 0) {
  console.log('Nothing to migrate.')
} else {
  await client.mutate(mutations as never)
  console.log(
    `Applied ${patches.length} prune patch(es)` +
      (skipDeletion ? '.' : ` and deleted ${existingDeletionDocs.length} duplicate document(s).`),
  )
}
