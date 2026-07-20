import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-06-01'})

type Issue = {
  _id: string
  articles?: Array<{_ref?: string}>
}

type Article = {
  _id: string
  title?: string
}

async function main() {
  const [issues, articles] = await Promise.all([
    client.fetch<Issue[]>('*[_type == "zineIssue" && !(_id in path("drafts.**"))]{_id, articles}'),
    client.fetch<Article[]>('*[_type == "zineArticle" && !(_id in path("drafts.**"))]{_id, title}'),
  ])

  const membershipCounts = new Map<string, number>()

  for (const issue of issues) {
    for (const articleId of issue.articles?.map((article) => article._ref).filter(Boolean) ?? []) {
      membershipCounts.set(articleId!, (membershipCounts.get(articleId!) ?? 0) + 1)
    }
  }

  const invalidArticles = articles.filter((article) => membershipCounts.get(article._id) !== 1)

  if (invalidArticles.length > 0) {
    throw new Error(
      `Every published Zine Article must belong to exactly one Issue:\n${invalidArticles
        .map((article) => `- ${article.title ?? article._id} (${membershipCounts.get(article._id) ?? 0} Issues)`)
        .join('\n')}`,
    )
  }

  console.log(`Zine membership audit passed for ${articles.length} published articles.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
