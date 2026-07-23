import {getCliClient} from 'sanity/cli'
import {
  migrateLegacyArticleBlock,
  type LegacyArticleBlock,
} from '../../../packages/schemas/src/articleMigration.ts'

type Article = {
  _id: string
  title?: string
  body?: Array<LegacyArticleBlock | Record<string, unknown>>
}

const client = getCliClient({apiVersion: '2026-07-22'})
const dryRun = process.argv.includes('--dry-run')

const articles = await client.fetch<Article[]>(
  `*[_type == "article" && count(body[_type in ["articleTextSection", "articleMediaSection"]]) > 0]{
    _id,
    title,
    body
  }`,
)

const transaction = client.transaction()
for (const article of articles) {
  const body = article.body?.map((block) =>
    block._type === 'articleTextSection' || block._type === 'articleMediaSection'
      ? migrateLegacyArticleBlock(block as LegacyArticleBlock)
      : block,
  )
  transaction.patch(article._id, (patch) => patch.set({body}))
}

if (articles.length === 0) {
  console.log('No legacy Article body blocks require migration.')
} else if (dryRun) {
  console.log(`Dry run complete. ${articles.length} Article document(s) would be migrated.`)
  for (const article of articles) console.log(`- ${article._id}: ${article.title ?? 'Untitled'}`)
} else {
  await transaction.commit()
  console.log(`Migrated ${articles.length} Article document(s).`)
}
