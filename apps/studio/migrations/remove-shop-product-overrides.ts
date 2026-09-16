import {getCliClient} from 'sanity/cli'

// Product ordering moved to a Shopify manual collection (shopPage now holds
// just the collection handle), so the handle-keyed productOverrides array was
// removed from the schema. This unsets any orphaned values on the singleton.
const client = getCliClient({apiVersion: '2026-06-01'})
const shopPageId = 'shopPage'

async function main() {
  const document = await client.fetch<{_id: string; productOverrides?: unknown[]} | null>(
    '*[_id == $id][0]{_id, productOverrides}',
    {id: shopPageId},
  )

  if (!document?.productOverrides?.length) {
    console.log('No product overrides to migrate.')
    return
  }

  await client.patch(shopPageId).unset(['productOverrides']).commit()
  console.log(`Removed ${document.productOverrides.length} product overrides from the Shop Page.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
