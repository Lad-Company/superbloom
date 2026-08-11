import {getCliClient} from 'sanity/cli'

// One-off: seed the homepage capabilities block's global contextual copy.
// Replaces the removed per-capability contextualCopy fields. Run with:
//   sanity exec migrations/seed-capes-contextual-copy.ts --with-user-token
const client = getCliClient({apiVersion: '2026-07-24'}).withConfig({perspective: 'raw'})

const copy =
  process.env.CAPES_CONTEXTUAL_COPY ??
  'One team of optimistic renegades, pushing ideas to the limit across specialties'

const homepage = await client.fetch<{_id: string} | null>(`*[_type == "homepage"][0]{_id}`)
if (!homepage?._id) {
  throw new Error('homepage document not found')
}

await client.patch(homepage._id).set({'capabilities.contextualCopy': copy}).commit()
console.log(`Set capabilities.contextualCopy = "${copy}" on ${homepage._id}`)
