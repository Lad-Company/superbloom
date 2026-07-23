import {migrateLegacyIndexPage, type LegacyIndexPage} from '@superbloom/schemas'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-06-01'})
const indexPageId = 'indexPage'

async function main() {
  const document = await client.fetch<(LegacyIndexPage & {_id: string}) | null>(
    '*[_id == $id][0]{_id,lead,secondary,featured,allSection}',
    {id: indexPageId},
  )
  const fields = migrateLegacyIndexPage(document ?? {})

  if (!document) {
    await client.create({_id: indexPageId, _type: 'indexPage', ...fields})
    console.log('Created and migrated Index Page singleton.')
    return
  }

  await client
    .patch(indexPageId)
    .set(fields)
    .unset(['lead', 'secondary'])
    .commit()
  console.log('Migrated Index Page singleton.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
