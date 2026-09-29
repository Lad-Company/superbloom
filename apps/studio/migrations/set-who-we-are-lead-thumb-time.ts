import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-08-03', perspective: 'raw'})

// The Who We Are lead video (the page's LCP poster) opens with a one-frame
// RGB glitch leader, so its time=0 thumbnail is 263KB at the 960 rung where
// the rest of the site's posters are 15-70KB. The web storefront now honors
// the mux plugin's `thumbTime` when building poster URLs; 0.5s lands on the
// "CULTURAL RENEGADES" title card — the first real frame, 39KB.
const PLAYBACK_ID = 'DcUfZ01a2OJ9EfqeAN3NokxGig01Ba9Ke6cM2lXjudupM'
const THUMB_TIME = 0.5

async function main() {
  const asset = await client.fetch<Array<{_id: string; thumbTime: number | null}>>(
    '*[_type == "mux.videoAsset" && playbackId == $playbackId]{_id, thumbTime}',
    {playbackId: PLAYBACK_ID},
  )

  if (asset.length === 0) {
    console.log(`No mux.videoAsset with playbackId ${PLAYBACK_ID} found — nothing to set.`)
    return
  }

  const transaction = client.transaction()
  for (const {_id, thumbTime} of asset) {
    if (thumbTime != null) {
      console.log(`Skipping ${_id} — thumbTime already set to ${thumbTime}.`)
      continue
    }
    console.log(`Setting thumbTime=${THUMB_TIME} on ${_id}`)
    transaction.patch(_id, (patch) => patch.set({thumbTime: THUMB_TIME}))
  }
  await transaction.commit()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
