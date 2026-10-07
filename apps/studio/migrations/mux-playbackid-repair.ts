import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'

/**
 * Repair mux.videoAsset docs whose top-level `playbackId` is null while the
 * asset's own data carries a live public playback ID.
 *
 * Origin: the 2026-10-06 premium→plus sweep (migrations/mux-plus-sweep.ts)
 * creates the new doc with `createIfNotExists` — but the Mux webhook
 * (passthrough-keyed) had already created several of those docs without a
 * top-level `playbackId`, so the sweep's create was a silent no-op and the
 * docs kept `playbackId: null`. The web projection reads `asset->playbackId`,
 * so every reference renders as an empty placeholder frame (found via the
 * missing Simon Malls lead film; 16 docs affected across 5 case studies).
 *
 * For each affected published doc:
 *   1. Cross-check the Mux asset directly: status ready, and the stored
 *      playback ID still present on the asset.
 *   2. Back the doc up to /tmp/sbh-playbackid-repair/.
 *   3. Patch `playbackId` (ifRevisionID-guarded; skipped if it got set
 *      meanwhile).
 *
 * Run from apps/studio:
 *   sanity exec migrations/mux-playbackid-repair.ts --with-user-token -- --dry-run
 *   sanity exec migrations/mux-playbackid-repair.ts --with-user-token
 */

const DRY_RUN = process.argv.includes('--dry-run')
const REPAIR_DIR = '/tmp/sbh-playbackid-repair'
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

async function mux<T>(method: string, path: string): Promise<T> {
  const res = await fetch(`${MUX_API}${path}`, {
    method,
    headers: {Authorization: muxAuth},
  })
  if (!res.ok) throw new Error(`Mux ${method} ${path} -> ${res.status}: ${await res.text()}`)
  return (await res.json()) as T
}

type BrokenDoc = {
  _id: string
  _rev: string
  assetId: string
  status: string | null
  pid: string | null
  policy: string | null
  refs: number
}

// --- main ---

const broken = await client.fetch<BrokenDoc[]>(`*[
  _type == "mux.videoAsset" &&
  !(_id in path("drafts.**")) &&
  !defined(playbackId) &&
  defined(data.playback_ids[0].id)
]{
  _id, _rev, assetId,
  "status": data.status,
  "pid": data.playback_ids[0].id,
  "policy": data.playback_ids[0].policy,
  "refs": count(*[references(^._id)])
}`)

console.log(`Affected docs (playbackId missing, data.playback_ids present): ${broken.length}`)
if (broken.length === 0) {
  console.log('Nothing to repair.')
  process.exit(0)
}

// Read-only cross-check against Mux before any write: the asset must be
// ready and still carry the playback ID we are about to publish.
const verified: BrokenDoc[] = []
for (const doc of broken) {
  const prefix = `  ${doc._id}  asset=${doc.assetId}  pid=${doc.pid}  refs=${doc.refs}`
  if (!doc.assetId || !doc.pid) {
    console.warn(`${prefix}\n    SKIP: missing assetId or pid in Sanity doc`)
    continue
  }
  if (doc.policy !== 'public') {
    console.warn(`${prefix}\n    SKIP: playback policy is ${doc.policy}, expected public`)
    continue
  }
  const {data: asset} = await mux<{data: {status: string; playback_ids?: {id: string}[]}}>(
    'GET',
    `/assets/${doc.assetId}`,
  )
  if (asset.status !== 'ready') {
    console.warn(`${prefix}\n    SKIP: Mux asset status is ${asset.status}`)
    continue
  }
  if (!asset.playback_ids?.some((p) => p.id === doc.pid)) {
    console.warn(`${prefix}\n    SKIP: pid ${doc.pid} not on the live Mux asset`)
    continue
  }
  console.log(`${prefix}  OK`)
  verified.push(doc)
}

if (DRY_RUN) {
  console.log(`\n--dry-run: would patch ${verified.length} doc(s); no writes performed.`)
  process.exit(0)
}

mkdirSync(REPAIR_DIR, {recursive: true})
const docs = await client.fetch<Record<string, unknown>[]>(`*[_id in $ids]`, {
  ids: verified.map((d) => d._id),
})
const backupPath = `${REPAIR_DIR}/backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
writeFileSync(backupPath, JSON.stringify(docs, null, 2))
console.log(`\nBacked up ${docs.length} doc(s) to ${backupPath}`)

let patched = 0
for (const doc of verified) {
  // Re-read the revision so a concurrent Studio edit can't be clobbered, and
  // skip if playbackId was set since the discovery query.
  const fresh = await client.fetch<{_rev: string; playbackId?: string} | null>(
    `*[_id == $id][0]{_rev, playbackId}`,
    {id: doc._id},
  )
  if (!fresh) {
    console.warn(`  ${doc._id}: doc vanished, skipping`)
    continue
  }
  if (fresh.playbackId) {
    console.log(`  ${doc._id}: playbackId already set, skipping`)
    continue
  }
  await client.request({
    url: `/data/mutate/${client.config().dataset}`,
    method: 'POST',
    body: {
      mutations: [
        {
          patch: {
            id: doc._id,
            ifRevisionID: fresh._rev,
            set: {playbackId: doc.pid},
          },
        },
      ],
    },
  })
  patched++
  console.log(`  patched ${doc._id} -> playbackId ${doc.pid}`)
}

console.log(`\nRepair complete. Patched ${patched}/${verified.length} verified doc(s).`)
