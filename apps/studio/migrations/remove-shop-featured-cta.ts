import {getCliClient} from 'sanity/cli'

// `perspective: 'raw'` so drafts carrying the legacy fields are cleaned too.
const client = getCliClient({apiVersion: '2026-08-03', perspective: 'raw'})

// The Featured Item CTA was removed from the schema and the storefront no
// longer renders it, so stored `featured.ctaLabel`/`featured.ctaHref` values
// are dead data.
async function main() {
  const shopPages = await client.fetch<Array<{_id: string}>>(
    '*[_type == "shopPage" && (defined(featured.ctaLabel) || defined(featured.ctaHref))]{_id}',
  )

  if (shopPages.length === 0) {
    console.log('No Shop Page documents with a featured CTA found — nothing to remove.')
    return
  }

  for (const {_id} of shopPages) {
    console.log(`Unsetting featured.ctaLabel/featured.ctaHref on ${_id}`)
  }

  const transaction = client.transaction()
  for (const {_id} of shopPages) {
    transaction.patch(_id, (patch) => patch.unset(['featured.ctaLabel', 'featured.ctaHref']))
  }
  await transaction.commit()

  console.log(`Removed the featured CTA from ${shopPages.length} Shop Page document(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
