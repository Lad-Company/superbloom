import {getCliClient} from 'sanity/cli'

// Removes the orphaned per-capability `contextualCopy` and legacy `subtitle`
// fields, replaced by the capes block's single global contextualCopy.
// `perspective: 'raw'` so drafts carrying the legacy fields are cleaned too.
const client = getCliClient({apiVersion: '2026-08-03', perspective: 'raw'})

async function main() {
  const capabilities = await client.fetch<Array<{_id: string}>>(
    '*[_type == "capability" && (defined(contextualCopy) || defined(subtitle))]{_id}',
  )

  if (capabilities.length === 0) {
    console.log('No orphaned capability copy fields found — nothing to remove.')
    return
  }

  for (const {_id} of capabilities) {
    console.log(`Unsetting contextualCopy/subtitle on ${_id}`)
  }

  const transaction = client.transaction()
  for (const {_id} of capabilities) {
    transaction.patch(_id, (patch) => patch.unset(['contextualCopy', 'subtitle']))
  }
  await transaction.commit()

  console.log(`Removed orphaned copy fields from ${capabilities.length} Capability document(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
