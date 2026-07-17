import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-17'})

const documents = await client.fetch<Array<{
  _id: string
  statCards?: Array<{_key: string; theme?: string}>
}>>(
  `*[_type == "whoWeAre" && (defined(featuredMedia.theme) || defined(marquee.theme) || count(statCards[defined(theme)]) > 0)]{_id, statCards[]{_key, theme}}`,
)

const transaction = client.transaction()

for (const document of documents) {
  const fields = ['featuredMedia.theme', 'marquee.theme']

  for (const card of document.statCards ?? []) {
    if (card.theme) {
      fields.push(`statCards[_key=="${card._key}"].theme`)
    }
  }

  transaction.patch(document._id, (patch) => patch.unset(fields))
}

await transaction.commit()
