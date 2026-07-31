import {getCliClient} from 'sanity/cli'

// One-off: set the homepage work block's layoutPreset. Run with:
//   pnpm --filter studio exec:sanity ... (or) sanity exec migrations/set-home-work-layout-preset.ts
// Pass --with-user-token to use the logged-in CLI session.
const client = getCliClient({apiVersion: '2026-07-24'}).withConfig({perspective: 'raw'})

const preset = process.env.LAYOUT_PRESET ?? 'stagger-right'

const homepage = await client.fetch<{_id: string} | null>(`*[_type == "homepage"][0]{_id}`)
if (!homepage?._id) {
  throw new Error('homepage document not found')
}

await client.patch(homepage._id).set({'work.layoutPreset': preset}).commit()
console.log(`Set work.layoutPreset = "${preset}" on ${homepage._id}`)
