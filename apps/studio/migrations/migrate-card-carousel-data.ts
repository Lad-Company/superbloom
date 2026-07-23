import {getCliClient} from 'sanity/cli'

const client = getCliClient({
  apiVersion: '2026-07-23',
  token: process.env.SANITY_API_TOKEN,
})

async function main() {
  const homepage = await client.fetch<{_id: string; news?: {items?: unknown[]}} | null>(
    '*[_id == "homepage"][0]{_id, news{items}}',
  )

  if (!homepage) {
    throw new Error('Homepage singleton was not found.')
  }

  if (homepage.news?.items?.length) {
    console.log('Homepage News list already has authored items.')
    return
  }

  const newsIds = await client.fetch<string[]>(
    '*[_type == "article" && articleType == "news"] | order(publicationDate desc)[0...8]._id',
  )
  const items = newsIds.map((reference, index) => ({
    _key: `news-${index + 1}`,
    _type: 'reference',
    _ref: reference,
  }))

  await client.patch(homepage._id).set({'news.items': items}).commit()
  console.log(`Migrated ${items.length} News items into the authored homepage list.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
