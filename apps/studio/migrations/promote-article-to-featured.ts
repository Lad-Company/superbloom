import {randomBytes} from 'node:crypto'
import {getCliClient} from 'sanity/cli'

// One-off content edit (requested for scroll QA): append an existing article
// to the Index Page featured array. Usage:
//   sanity exec migrations/promote-article-to-featured.ts -- <articleId>
const client = getCliClient({apiVersion: '2026-06-01'})
const indexPageId = 'indexPage'

async function main() {
  const articleId = process.argv[2]
  if (!articleId) throw new Error('Pass an article _id as the first argument')

  const article = await client.fetch<{_id: string; title: string} | null>(
    '*[_type == "article" && _id == $id][0]{_id, title}',
    {id: articleId},
  )
  if (!article) throw new Error(`No article found with _id "${articleId}"`)

  const doc = await client.fetch<{
    featured?: Array<{_key: string; article?: {_ref: string}}>
  } | null>('*[_id == $id][0]{featured[]{_key, article}}', {id: indexPageId})

  const featured = doc?.featured ?? []
  if (featured.some((card) => card.article?._ref === articleId)) {
    console.log(`"${article.title}" is already featured.`)
    return
  }

  await client
    .patch(indexPageId)
    .setIfMissing({featured: []})
    .append('featured', [
      {
        _key: randomBytes(6).toString('hex'),
        _type: 'featuredCard',
        article: {_type: 'reference', _ref: articleId},
      },
    ])
    .commit()
  console.log(`Featured "${article.title}" (${featured.length + 1} cards total).`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
