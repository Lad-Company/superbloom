import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'

/**
 * Cut a short loop out of an existing Mux asset, server-side, with MP4 static
 * renditions for a native `<video>` hero (no HLS, no player chunk).
 *
 *   1. Create a `plus` clip of the source (`mux://assets/<id>` input with
 *      `start_time` / `end_time`) and request 720p + 1080p static renditions.
 *   2. Wait for the asset and its renditions to be ready, then PATCH
 *      `passthrough` to a fresh UUID (== the Sanity `mux.videoAsset` doc `_id`,
 *      matching sanity-plugin-mux-input's linking convention).
 *   3. Create the `mux.videoAsset` doc so the clip is pickable in Studio.
 *
 * Nothing is repointed: the editor selects the new asset on the page that
 * should use it. The source asset and its doc are never touched. Resumable via
 * /tmp/sbh-hero-clip/state.json. Run from apps/studio:
 *   sanity exec migrations/mux-hero-clip.ts --with-user-token -- \
 *     --source <assetId> --start 13.2 --end 25.3 [--title "..."] [--dry-run]
 */

const args = process.argv.slice(2)
const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}
const DRY_RUN = args.includes('--dry-run')
const SOURCE_ASSET_ID = flag('source')
const START_S = Number(flag('start'))
const END_S = Number(flag('end'))
const TITLE = flag('title')
if (!SOURCE_ASSET_ID || !Number.isFinite(START_S) || !Number.isFinite(END_S) || END_S <= START_S) {
  throw new Error('Usage: --source <assetId> --start <seconds> --end <seconds> [--title ...] [--dry-run]')
}

const CLIP_DIR = '/tmp/sbh-hero-clip'
const STATE_PATH = `${CLIP_DIR}/state.json`
const MUX_API = 'https://api.mux.com/video/v1'
const RENDITIONS = ['720p', '1080p'] as const

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

type StaticRenditionFile = {
  name: string
  status: 'ready' | 'preparing' | 'skipped' | 'errored'
  resolution: string
  filesize?: string
  bitrate?: number
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
  static_renditions?: {status?: string; files?: StaticRenditionFile[]}
  [key: string]: unknown
}

/** Ready means the asset *and* every requested rendition are ready — the
 *  renditions encode after the asset flips to ready, and the hero must never
 *  reference an MP4 URL that 404s. */
async function waitForReady(assetId: string): Promise<MuxAsset> {
  const deadline = Date.now() + 10 * 60 * 1000
  for (;;) {
    const {data} = await mux<{data: MuxAsset}>('GET', `/assets/${assetId}`)
    if (data.status === 'errored') throw new Error(`Mux asset ${assetId} errored`)
    const files = data.static_renditions?.files ?? []
    const errored = files.filter((f) => f.status === 'errored')
    if (errored.length) throw new Error(`renditions errored: ${errored.map((f) => f.name).join(', ')}`)
    const settled =
      data.status === 'ready' &&
      RENDITIONS.every((r) => files.some((f) => f.resolution === r && f.status === 'ready'))
    if (settled) return data
    if (Date.now() > deadline) throw new Error(`Mux asset ${assetId} not ready after 10 min`)
    await new Promise((r) => setTimeout(r, 5000))
  }
}

// --- state ---

type ClipState = {
  status: 'planned' | 'mux-created' | 'ready' | 'done' | 'failed'
  newDocId?: string
  newAssetId?: string
  newPlaybackId?: string
  error?: string
}
type State = Record<string, ClipState>

const stateKey = `${SOURCE_ASSET_ID}:${START_S}-${END_S}`
function loadState(): State {
  if (existsSync(STATE_PATH)) return JSON.parse(readFileSync(STATE_PATH, 'utf8')) as State
  return {}
}
function saveState(state: State): void {
  mkdirSync(CLIP_DIR, {recursive: true})
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
}

// --- main ---

const {data: source} = await mux<{data: MuxAsset}>('GET', `/assets/${SOURCE_ASSET_ID}`)
if (source.status !== 'ready') throw new Error(`source asset is ${source.status}, not ready`)
if ((source.duration ?? 0) < END_S) {
  throw new Error(`--end ${END_S}s is past the source duration (${source.duration?.toFixed(2)}s)`)
}
const sourceDoc = await client.fetch<{_id: string; filename?: string} | null>(
  `*[_type == "mux.videoAsset" && assetId == $assetId && !(_id in path("drafts.**"))][0]{_id, filename}`,
  {assetId: SOURCE_ASSET_ID},
)
const title =
  TITLE ?? `${sourceDoc?.filename || SOURCE_ASSET_ID} loop ${START_S}s-${END_S}s`

console.log(`Source: ${SOURCE_ASSET_ID}  ${source.duration?.toFixed(2)}s  ${source.video_quality}  ${source.max_resolution_tier}`)
console.log(`Sanity doc: ${sourceDoc?._id ?? '(none found)'}  filename: ${sourceDoc?.filename || '(blank)'}`)
console.log(`Clip: ${START_S}s -> ${END_S}s  (${(END_S - START_S).toFixed(2)}s)`)
console.log(`Renditions: ${RENDITIONS.join(', ')}`)
console.log(`Title: ${title}`)

const state = loadState()
state[stateKey] = state[stateKey] ?? {status: 'planned'}
const s = state[stateKey]
if (s.status === 'done') {
  console.log(`\nAlready done: asset ${s.newAssetId} playback ${s.newPlaybackId} doc ${s.newDocId}`)
  process.exit(0)
}
if (s.status === 'failed') s.status = s.newAssetId ? 'mux-created' : 'planned'

if (DRY_RUN) {
  console.log('\n--dry-run: no writes performed.')
  process.exit(0)
}

try {
  // 1. Create the clip (server-side; no download/upload).
  if (s.status === 'planned') {
    const {data: created} = await mux<{data: MuxAsset}>('POST', '/assets', {
      inputs: [{url: `mux://assets/${SOURCE_ASSET_ID}`, start_time: START_S, end_time: END_S}],
      video_quality: 'plus',
      max_resolution_tier: '1080p',
      playback_policies: ['public'],
      static_renditions: RENDITIONS.map((resolution) => ({resolution})),
      meta: {title},
    })
    s.newAssetId = created.id
    s.status = 'mux-created'
    saveState(state)
    console.log(`\ncreated clip ${created.id}`)
  }

  // 2. Wait for the asset + renditions, set passthrough to the new Sanity doc id.
  if (s.status === 'mux-created') {
    console.log('waiting for asset and renditions...')
    const ready = await waitForReady(s.newAssetId!)
    s.newDocId = s.newDocId ?? randomUUID()
    await mux('PATCH', `/assets/${s.newAssetId}`, {passthrough: s.newDocId})
    const after = await mux<{data: MuxAsset}>('GET', `/assets/${s.newAssetId}`)
    if (after.data.passthrough !== s.newDocId)
      throw new Error(`passthrough did not stick on ${s.newAssetId}`)
    s.newPlaybackId = ready.playback_ids?.[0]?.id
    if (!s.newPlaybackId) throw new Error(`no playback id on ${s.newAssetId}`)
    s.status = 'ready'
    saveState(state)
    console.log(`ready; passthrough=${s.newDocId} playback=${s.newPlaybackId}`)
  }

  // 3. Create the mux.videoAsset doc (same shape as the plugin / plus sweep).
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
            filename: title,
            data,
          },
        },
      ],
    },
  })
  s.status = 'done'
  saveState(state)

  console.log(`\nDone.`)
  console.log(`  asset:     ${s.newAssetId}`)
  console.log(`  playback:  ${s.newPlaybackId}`)
  console.log(`  sanity:    ${s.newDocId}  (pick "${title}" in Studio)`)
  console.log(`  duration:  ${asset.data.duration?.toFixed(2)}s`)
  for (const f of asset.data.static_renditions?.files ?? []) {
    const mb = f.filesize ? (Number(f.filesize) / 1_000_000).toFixed(1) : '?'
    const kbps = f.bitrate ? Math.round(f.bitrate / 1000) : '?'
    console.log(`  ${f.name.padEnd(10)} ${mb} MB  ${kbps} kbps  https://stream.mux.com/${s.newPlaybackId}/${f.name}`)
  }
} catch (err) {
  s.status = 'failed'
  s.error = err instanceof Error ? err.message : String(err)
  saveState(state)
  console.error(`\nFAILED: ${s.error} (source untouched; re-run to resume)`)
  process.exit(1)
}
