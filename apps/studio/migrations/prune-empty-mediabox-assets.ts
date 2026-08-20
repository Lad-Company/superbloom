import {getCliClient} from 'sanity/cli'

/**
 * Prunes corrupt mediaBox asset arrays across all documents (published +
 * drafts).
 *
 * The mediaBox schema requires exactly one asset, but some docs (notably
 * article-news-1's cardMedia) shipped with stray empty array members ahead of
 * the real asset. The web projection takes the first member that references
 * an asset, but the corrupt data itself is cleaned here: drop members without
 * an asset reference, keep the first member that has one.
 *
 * The first production run (2026-08-20) also backed up and deleted the
 * duplicate editorial copy of the 5th-Birthday story
 * (f9698dcf-53b1-40a5-bff0-a8f92d2c6f98, no references); that one-off cleanup
 * is not part of this script.
 *
 * Idempotent. Run with --dry-run to review the report without writing.
 */

const client = getCliClient({apiVersion: '2026-07-22'}).withConfig({perspective: 'raw'})
const dryRun = process.argv.includes('--dry-run')

type Json = Record<string, unknown>

type Patch = {id: string; path: string; value: unknown}

type PathSegment = string | {_key: string}

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

const escapeKey = (key: string): string => key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

/**
 * Canonical Sanity patch path, e.g. `body[_key=="abc"].media` — a keyed
 * segment attaches to its parent with no dot in between.
 */
const pathToString = (path: PathSegment[]): string =>
  path
    .map((segment, index) => {
      if (typeof segment !== 'string') return `[_key=="${escapeKey(segment._key)}"]`
      return index === 0 ? segment : `.${segment}`
    })
    .join('')

/** True when a corrupt mediaBox hides somewhere inside a keyless array member. */
const containsPrunableMediaBox = (node: unknown): boolean => {
  if (Array.isArray(node)) return node.some(containsPrunableMediaBox)
  if (!isRecord(node)) return false
  if (node._type === 'mediaBox') return pruneMediaBox(node) !== null
  return Object.values(node).some(containsPrunableMediaBox)
}

const collectPatches = (doc: Json): {patches: Patch[]; unaddressable: string[]} => {
  const patches: Patch[] = []
  const unaddressable: string[] = []

  const walk = (node: unknown, path: PathSegment[]) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        if (isRecord(item) && typeof item._key === 'string') {
          walk(item, [...path, {_key: item._key}])
        } else if (containsPrunableMediaBox(item)) {
          // No _key means no addressable patch path; report instead of skipping silently.
          unaddressable.push(pathToString(path))
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
          path: pathToString(path),
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

  return {patches, unaddressable}
}

console.log('Scanning all documents (published + drafts) for corrupt mediaBox assets...')

const docs = await client.fetch<Json[]>(`*[!(_type match "system.*") && !(_type match "sanity.*")]`)
const patches: Patch[] = []
for (const doc of docs) {
  const {patches: docPatches, unaddressable} = collectPatches(doc)
  patches.push(...docPatches)
  for (const path of unaddressable) {
    console.log(
      `  WARN ${doc._id} at ${path}: mediaBox inside an array member without a _key cannot be patched; inspect manually.`,
    )
  }
}

for (const patch of patches) {
  console.log(`  PRUNE ${patch.id} at ${patch.path}`)
}
console.log(`${patches.length} mediaBox field(s) to prune across ${docs.length} document(s).`)

if (dryRun) {
  console.log('Dry run complete. No documents were changed.')
  process.exit(0)
}

const mutations = patches.map((patch) => ({patch: {id: patch.id, set: {[patch.path]: patch.value}}}))

if (mutations.length === 0) {
  console.log('Nothing to migrate.')
} else {
  await client.mutate(mutations as never)
  console.log(`Applied ${mutations.length} prune patch(es).`)
}
