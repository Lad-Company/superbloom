import {getCliClient} from 'sanity/cli'

// `perspective: 'raw'` so drafts carrying the legacy field are cleaned too.
const client = getCliClient({apiVersion: '2026-08-03', perspective: 'raw'})

// The Creative Collective CTA destination is no longer CMS-controlled (it
// always links to the contact form with the collective inquiry pre-selected),
// so the stored `why.ctaHref` values are dead data.
async function main() {
  const homepages = await client.fetch<Array<{_id: string}>>(
    '*[_type == "homepage" && defined(why.ctaHref)]{_id}',
  )

  if (homepages.length === 0) {
    console.log('No Homepage documents with why.ctaHref found — nothing to remove.')
    return
  }

  for (const {_id} of homepages) console.log(`Unsetting why.ctaHref on ${_id}`)

  const transaction = client.transaction()
  for (const {_id} of homepages) {
    transaction.patch(_id, (patch) => patch.unset(['why.ctaHref']))
  }
  await transaction.commit()

  console.log(`Removed why.ctaHref from ${homepages.length} Homepage document(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
