import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-06-01'})

async function main() {
  const doc = await client.fetch<{
    _id: string
    _type: string
    featured?: Array<{_key: string; article?: {_ref: string}}>
  } | null>('*[_id == "indexPage"][0]{_id, _type, "dataset": null, featured[]{_key, article}}')
  console.log('indexPage:', JSON.stringify(doc, null, 2))

  const featuredIds = (doc?.featured ?? []).map((f) => f.article?._ref).filter(Boolean)

  const articles = await client.fetch<
    Array<{
      _id: string
      title: string
      articleType: string
      publicationDate?: string
      slug?: string
    }>
  >(
    `*[_type == "article" && articleType in ["news", "editorial"] && defined(slug.current)]
      | order(publicationDate desc)[0...40]{_id, title, articleType, publicationDate, "slug": slug.current}`,
  )
  console.log('\nFeatured refs:', featuredIds)
  console.log('\nLatest news/editorial articles:')
  for (const a of articles) {
    const mark = featuredIds.includes(a._id) ? ' [FEATURED]' : ''
    console.log(`${a._id}  ${a.articleType}  ${a.publicationDate ?? '-'}  ${a.title}${mark}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
