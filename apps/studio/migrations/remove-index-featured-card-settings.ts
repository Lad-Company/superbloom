import {getCliClient} from 'sanity/cli'

// The Index Page featured layout is now locked by the frontend (lead 3/4 at
// 4:5, side rail 1:1 with info below), so the per-card settings fields were
// removed from the schema. This unsets the orphaned values on the singleton.
const client = getCliClient({apiVersion: '2026-06-01'})
const indexPageId = 'indexPage'

async function main() {
  const document = await client.fetch<{_id: string; featured?: Array<{_key: string}>} | null>(
    '*[_id == $id][0]{_id, featured[]{_key}}',
    {id: indexPageId},
  )

  if (!document?.featured?.length) {
    console.log('No featured cards to migrate.')
    return
  }

  const paths = document.featured.flatMap(({_key}) => [
    `featured[_key=="${_key}"].cardWidth`,
    `featured[_key=="${_key}"].mediaAspectRatio`,
    `featured[_key=="${_key}"].infoPosition`,
  ])

  await client.patch(indexPageId).unset(paths).commit()
  console.log(`Removed card settings from ${document.featured.length} featured cards.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
