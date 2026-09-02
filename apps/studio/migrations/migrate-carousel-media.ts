import {getCliClient} from 'sanity/cli'

/**
 * Renames the Carousel Block's array field from `videos` to `media` across
 * all documents (published + drafts).
 *
 * The block now accepts images as well as videos, so the field and its web
 * projection were renamed. The block _type (`contentLayoutCarousel`) is
 * unchanged; only the nested field moves.
 *
 * Carousel blocks live inside Content Layout Rows in Article bodies and in
 * every Case Study section (highlights/challenge/unexpectedInsight/bigIdea
 * mediaLayouts and results supportingRows); the walk is generic, so any
 * other nesting is covered too.
 *
 * Idempotent: blocks that already carry `media` (or never had `videos`) are
 * skipped. Run with --dry-run to review the report without writing.
 */

const client = getCliClient({apiVersion: '2026-07-22'}).withConfig({perspective: 'raw'})
const dryRun = process.argv.includes('--dry-run')

type Json = Record<string, unknown>

type Patch = {id: string; path: string; value: unknown}

type PathSegment = string | {_key: string}

const isRecord = (value: unknown): value is Json =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

const escapeKey = (key: string): string => key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

/**
 * Canonical Sanity patch path, e.g. `body[_key=="abc"].blocks[_key=="def"]` —
 * a keyed segment attaches to its parent with no dot in between.
 */
const pathToString = (path: PathSegment[]): string =>
  path
    .map((segment, index) => {
      if (typeof segment !== 'string') return `[_key=="${escapeKey(segment._key)}"]`
      return index === 0 ? segment : `.${segment}`
    })
    .join('')

const collectPatches = (doc: Json): Patch[] => {
  const patches: Patch[] = []

  const walk = (node: unknown, path: PathSegment[]) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        if (isRecord(item) && typeof item._key === 'string') {
          walk(item, [...path, {_key: item._key}])
        }
      }
      return
    }
    if (!isRecord(node)) return

    if (node._type === 'contentLayoutCarousel') {
      // Only migrate when `videos` holds data and `media` does not — a block
      // already carrying `media` is current, and overwriting it would lose
      // newer edits.
      if (Array.isArray(node.videos) && !Array.isArray(node.media)) {
        patches.push({
          id: doc._id as string,
          path: pathToString(path),
          value: node.videos,
        })
      }
      return
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

console.log('Scanning all documents (published + drafts) for Carousel blocks with `videos`...')

const docs = await client.fetch<Json[]>(`*[!(_type match "system.*") && !(_type match "sanity.*")]`)
const patches: Patch[] = []
for (const doc of docs) {
  patches.push(...collectPatches(doc))
}

for (const patch of patches) {
  console.log(`  RENAME ${patch.id} at ${patch.path}: videos -> media`)
}
console.log(`${patches.length} Carousel block(s) to migrate across ${docs.length} document(s).`)

if (dryRun) {
  console.log('Dry run complete. No documents were changed.')
  process.exit(0)
}

const mutations = patches.map((patch) => ({
  patch: {
    id: patch.id,
    set: {[`${patch.path}.media`]: patch.value},
    unset: [`${patch.path}.videos`],
  },
}))

if (mutations.length === 0) {
  console.log('Nothing to migrate.')
} else {
  await client.mutate(mutations as never)
  console.log(`Applied ${mutations.length} rename patch(es).`)
}
