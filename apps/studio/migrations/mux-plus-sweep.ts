import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'

/**
 * Sweep every referenced premium-quality Mux asset to `plus`.
 *
 * For each published `mux.videoAsset` doc whose Mux asset is premium and which
 * is referenced by at least one document:
 *   1. Create a `plus` copy server-side (`mux://assets/<id>` input).
 *   2. Wait for the copy to be ready, then PATCH its `passthrough` to a fresh
 *      UUID (passthrough == the Sanity `mux.videoAsset` doc `_id`, matching
 *      sanity-plugin-mux-input's linking convention).
 *   3. Create the new `mux.videoAsset` doc, then repoint every reference
 *      (published docs AND their `drafts.` twins) in one transaction per
 *      referencing doc, guarded by `ifRevisionID`.
 *
 * Resumable via /tmp/sbh-plus-sweep/state.json. Old assets/docs are never
 * touched. Run from apps/studio:
 *   sanity exec migrations/mux-plus-sweep.ts --with-user-token -- --dry-run
 *   sanity exec migrations/mux-plus-sweep.ts --with-user-token
 */

const DRY_RUN = process.argv.includes('--dry-run')
const SWEEP_DIR = '/tmp/sbh-plus-sweep'
const STATE_PATH = `${SWEEP_DIR}/state.json`
const MUX_API = 'https://api.mux.com/video/v1'

// --- credentials (repo-root .env.local; never logged) ---

function loadEnv(): Record<string, string> {
  const candidates = [
    resolve(process.cwd(), '../../.env.local'),
    resolve(process.cwd(), '.env.local'),
  ]
  const path = candidates.find((p) => existsSync(p))
  if (!path) throw new Error(`.env.local not found (tried ${candidates.join(', ')})`)
  const env: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnv()
for (const key of ['MUX_TOKEN_ID', 'MUX_SECRET_KEY', 'SANITY_API_TOKEN']) {
  if (!env[key]) throw new Error(`Missing ${key} in .env.local`)
}

const muxAuth = `Basic ${Buffer.from(`${env.MUX_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString('base64')}`
const client = getCliClient({apiVersion: '2026-07-24'}).withConfig({
  perspective: 'raw',
  token: env.SANITY_API_TOKEN,
  useCdn: false,
})

// --- Mux API ---

async function mux<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${MUX_API}${path}`, {
    method,
    headers: {Authorization: muxAuth, 'Content-Type': 'application/json'},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Mux ${method} ${path} -> ${res.status}: ${await res.text()}`)
  return (await res.json()) as T
}

type MuxAsset = {
  id: string
  status: string
  passthrough?: string
  video_quality?: string
  max_resolution_tier?: string
  duration?: number
  tracks?: unknown[]
  playback_ids?: {policy: string; id: string}[]
  [key: string]: unknown
}

async function waitForReady(assetId: string): Promise<MuxAsset> {
  const deadline = Date.now() + 10 * 60 * 1000
  for (;;) {
    const {data} = await mux<{data: MuxAsset}>('GET', `/assets/${assetId}`)
    if (data.status === 'ready') return data
    if (data.status === 'errored') throw new Error(`Mux asset ${assetId} errored`)
    if (Date.now() > deadline) throw new Error(`Mux asset ${assetId} not ready after 10 min`)
    await new Promise((r) => setTimeout(r, 5000))
  }
}

// --- reference walking ---

type PathSeg = string | {key: string}

function findRefPaths(node: unknown, targetId: string, path: PathSeg[], out: PathSeg[][]): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      if (item && typeof item === 'object' && typeof (item as {_key?: string})._key === 'string') {
        findRefPaths(item, targetId, [...path, {key: (item as {_key: string})._key}], out)
      }
    }
    return
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (obj._ref === targetId && obj._type === 'reference') {
      out.push(path)
      return
    }
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('_')) continue
      findRefPaths(v, targetId, [...path, k], out)
    }
  }
}

function toPatchPath(segs: PathSeg[]): string {
  return segs
    .map((s) => (typeof s === 'string' ? `.${s}` : `[_key=="${s.key}"]`))
    .join('')
    .replace(/^\./, '')
}

// --- state ---

type AssetState = {
  status: 'planned' | 'mux-created' | 'ready' | 'done' | 'failed'
  oldAssetId: string
  duration?: number | null
  resolutionTier?: string | null
  refs: {docId: string; hasDraft: boolean; paths: string[]; draftPaths: string[]}[]
  newDocId?: string
  newAssetId?: string
  newPlaybackId?: string
  error?: string
}
type State = {startedAt: string; assets: Record<string, AssetState>}

function loadState(): State {
  if (existsSync(STATE_PATH)) return JSON.parse(readFileSync(STATE_PATH, 'utf8')) as State
  return {startedAt: new Date().toISOString(), assets: {}}
}
function saveState(state: State): void {
  mkdirSync(SWEEP_DIR, {recursive: true})
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
}

// --- discovery ---

type VideoAssetDoc = {
  _id: string
  assetId: string
  data?: {video_quality?: string; encoding_tier?: string; duration?: number; resolution_tier?: string}
}

async function discover(): Promise<{premium: VideoAssetDoc[]; unreferenced: VideoAssetDoc[]}> {
  const docs = await client.fetch<VideoAssetDoc[]>(
    `*[_type == "mux.videoAsset" && !(_id in path("drafts.**")) && coalesce(data.video_quality, data.encoding_tier) == "premium"]{
      _id, assetId, data,
      "refs": count(*[references(^._id)])
    }`,
  )
  const withRefs = docs as (VideoAssetDoc & {refs?: number})[]
  return {
    premium: withRefs.filter((d) => (d.refs ?? 0) > 0),
    unreferenced: withRefs.filter((d) => (d.refs ?? 0) === 0),
  }
}

async function collectRefs(assetDocId: string): Promise<AssetState['refs']> {
  const referrers = await client.fetch<{_id: string}[]>(`*[references($id)]{_id}`, {
    id: assetDocId,
  })
  const baseIds = [...new Set(referrers.map((r) => r._id.replace(/^drafts\./, '')))]
  const refs: AssetState['refs'] = []
  for (const baseId of baseIds) {
    const [pub, draft] = await Promise.all([
      client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, {id: baseId}),
      client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, {id: `drafts.${baseId}`}),
    ])
    const pubPaths: string[][] = []
    const draftPaths: string[][] = []
    if (pub) findRefPaths(pub, assetDocId, [], pubPaths)
    if (draft) findRefPaths(draft, assetDocId, [], draftPaths)
    refs.push({
      docId: baseId,
      hasDraft: Boolean(draft),
      paths: pubPaths.map(toPatchPath),
      draftPaths: draftPaths.map(toPatchPath),
    })
  }
  return refs
}

// --- main ---

const {premium, unreferenced} = await discover()
console.log(`Referenced premium assets: ${premium.length}`)
console.log(`Unreferenced premium assets (cleanup candidates): ${unreferenced.length}`)

// Cross-check against the Mux account (read-only).
const muxList = await mux<{data: MuxAsset[]}>('GET', `/assets?limit=100`)
const muxById = new Map(muxList.data.map((a) => [a.id, a]))
for (const doc of premium) {
  const a = muxById.get(doc.assetId)
  if (!a) console.warn(`  WARN: Sanity doc ${doc._id} assetId ${doc.assetId} not found in Mux`)
  else if (a.video_quality !== 'premium')
    console.warn(`  WARN: ${doc.assetId} is ${a.video_quality} in Mux, premium in Sanity`)
}

const state = loadState()
for (const doc of premium) {
  if (state.assets[doc._id]?.status === 'done') continue
  state.assets[doc._id] = state.assets[doc._id] ?? {
    status: 'planned',
    oldAssetId: doc.assetId,
    duration: doc.data?.duration ?? null,
    resolutionTier: doc.data?.resolution_tier ?? null,
    refs: [],
  }
  state.assets[doc._id].refs = await collectRefs(doc._id)
}
saveState(state)

const todo = premium.filter((d) => state.assets[d._id].status !== 'done')
console.log(`\nTo convert: ${todo.length} (${premium.length - todo.length} already done)`)
for (const doc of todo) {
  const s = state.assets[doc._id]
  const draftCount = s.refs.filter((r) => r.hasDraft).length
  console.log(
    `  ${doc._id}  asset=${s.oldAssetId}  ${Math.round(s.duration ?? 0)}s ${s.resolutionTier ?? '?'}  ` +
      `${s.refs.length} doc(s), ${s.refs.reduce((n, r) => n + r.paths.length, 0)} ref(s), ${draftCount} draft twin(s)`,
  )
}
console.log(`\nUnreferenced premium (list-only, no action):`)
for (const doc of unreferenced) {
  console.log(`  ${doc._id}  asset=${doc.assetId}  ${Math.round(doc.data?.duration ?? 0)}s`)
}

if (DRY_RUN) {
  console.log('\n--dry-run: no writes performed.')
  process.exit(0)
}

// Backup every referencing doc (published + drafts) before any write.
const backupIds = [
  ...new Set(
    todo.flatMap((d) =>
      state.assets[d._id].refs.flatMap((r) => [r.docId, `drafts.${r.docId}`]),
    ),
  ),
]
const backup = await client.fetch<Record<string, unknown>[]>(
  `*[_id in $ids]`,
  {ids: backupIds},
)
const backupPath = `${SWEEP_DIR}/backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
writeFileSync(backupPath, JSON.stringify(backup, null, 2))
console.log(`\nBacked up ${backup.length} doc(s) to ${backupPath}`)

// Conversion loop.
for (const doc of todo) {
  const s = state.assets[doc._id]
  // Resume a previously failed asset from wherever it actually got to.
  if (s.status === 'failed') s.status = s.newAssetId ? 'mux-created' : 'planned'
  console.log(`\n=== ${doc._id} (source asset ${s.oldAssetId}) ===`)
  try {
    // 1. Create the plus copy (server-side clip; no download/upload).
    if (s.status === 'planned') {
      // max_resolution_tier has no 720p value; 1080p caps 720p sources at source res.
      const {data: created} = await mux<{data: MuxAsset}>('POST', '/assets', {
        inputs: [{url: `mux://assets/${s.oldAssetId}`}],
        video_quality: 'plus',
        max_resolution_tier: '1080p',
        playback_policies: ['public'],
      })
      s.newAssetId = created.id
      s.status = 'mux-created'
      saveState(state)
      console.log(`  created plus copy ${created.id}`)
    }

    // 2. Wait for ready, set passthrough to the new Sanity doc id.
    if (s.status === 'mux-created') {
      const ready = await waitForReady(s.newAssetId!)
      s.newDocId = randomUUID()
      await mux('PATCH', `/assets/${s.newAssetId}`, {passthrough: s.newDocId})
      const after = await mux<{data: MuxAsset}>('GET', `/assets/${s.newAssetId}`)
      if (after.data.passthrough !== s.newDocId)
        throw new Error(`passthrough did not stick on ${s.newAssetId}`)
      s.newPlaybackId = ready.playback_ids?.[0]?.id
      if (!s.newPlaybackId) throw new Error(`no playback id on ${s.newAssetId}`)
      s.status = 'ready'
      saveState(state)
      console.log(`  ready; passthrough=${s.newDocId} playback=${s.newPlaybackId}`)
    }

    // 3. Create the mux.videoAsset doc, then repoint every referencing doc.
    const asset = await mux<{data: MuxAsset}>('GET', `/assets/${s.newAssetId}`)
    const {tracks: _tracks, ...data} = asset.data
    await client.request({
      url: `/data/mutate/${client.config().dataset}`,
      method: 'POST',
      body: {
        mutations: [
          {
            createIfNotExists: {
              _id: s.newDocId,
              _type: 'mux.videoAsset',
              assetId: s.newAssetId,
              playbackId: s.newPlaybackId,
              status: 'ready',
              filename: '',
              data,
            },
          },
        ],
      },
    })

    for (const ref of s.refs) {
      const refValue = {_type: 'reference', _weak: true, _ref: s.newDocId}
      const mutations: Record<string, unknown>[] = []
      if (ref.paths.length > 0) {
        const pub = await client.fetch<{_rev: string}>(`*[_id == $id][0]{_rev}`, {id: ref.docId})
        mutations.push({
          patch: {
            id: ref.docId,
            ifRevisionID: pub._rev,
            set: Object.fromEntries(ref.paths.map((p) => [p, refValue])),
          },
        })
      }
      if (ref.draftPaths.length > 0) {
        const draft = await client.fetch<{_rev: string}>(`*[_id == $id][0]{_rev}`, {
          id: `drafts.${ref.docId}`,
        })
        mutations.push({
          patch: {
            id: `drafts.${ref.docId}`,
            ifRevisionID: draft._rev,
            set: Object.fromEntries(ref.draftPaths.map((p) => [p, refValue])),
          },
        })
      } else if (ref.hasDraft) {
        console.warn(`  WARN: drafts.${ref.docId} has no refs to old asset; review manually`)
      }
      if (mutations.length === 0) continue
      try {
        await client.request({
          url: `/data/mutate/${client.config().dataset}`,
          method: 'POST',
          body: {mutations},
        })
      } catch {
        // One retry on revision conflict: re-fetch and rebuild.
        console.warn(`  revision conflict on ${ref.docId}; retrying once`)
        const retryMutations: Record<string, unknown>[] = []
        if (ref.paths.length > 0) {
          const pub = await client.fetch<{_rev: string}>(`*[_id == $id][0]{_rev}`, {id: ref.docId})
          retryMutations.push({
            patch: {
              id: ref.docId,
              ifRevisionID: pub._rev,
              set: Object.fromEntries(ref.paths.map((p) => [p, refValue])),
            },
          })
        }
        if (ref.draftPaths.length > 0) {
          const draft = await client.fetch<{_rev: string}>(`*[_id == $id][0]{_rev}`, {
            id: `drafts.${ref.docId}`,
          })
          retryMutations.push({
            patch: {
              id: `drafts.${ref.docId}`,
              ifRevisionID: draft._rev,
              set: Object.fromEntries(ref.draftPaths.map((p) => [p, refValue])),
            },
          })
        }
        await client.request({
          url: `/data/mutate/${client.config().dataset}`,
          method: 'POST',
          body: {mutations: retryMutations},
        })
      }
      console.log(`  repointed ${ref.docId}${ref.draftPaths.length ? ' (+draft)' : ''}`)
    }

    s.status = 'done'
    saveState(state)
    console.log(`  done: ${s.oldAssetId} -> ${s.newAssetId}`)
  } catch (err) {
    s.status = 'failed'
    s.error = err instanceof Error ? err.message : String(err)
    saveState(state)
    console.error(`  FAILED: ${s.error} (old asset untouched; re-run to resume)`)
  }
}

// Post-sweep verification query.
const remaining = await client.fetch<number>(
  `count(*[_type == "mux.videoAsset" && !(_id in path("drafts.**")) && coalesce(data.video_quality, data.encoding_tier) == "premium" && count(*[references(^._id)]) > 0])`,
)
const failed = Object.entries(state.assets).filter(([, s]) => s.status === 'failed')
console.log(`\nSweep complete. Referenced premium remaining: ${remaining}. Failed: ${failed.length}.`)
if (failed.length) for (const [id, s] of failed) console.error(`  ${id}: ${s.error}`)
