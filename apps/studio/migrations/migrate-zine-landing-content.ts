import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-24'})

type EditorLetter = unknown[] | {
  body?: unknown
  media?: unknown
  labels?: unknown
  heading?: unknown
  ctaLabel?: unknown
}

type ZineIssue = {
  _id: string
  heroMedia?: unknown
  editorLetter?: EditorLetter
}

type ZineArticle = {
  _id: string
  cardCtaLabel?: string
}

async function main() {
  const [issues, articles] = await Promise.all([
    client.fetch<ZineIssue[]>('*[_type == "zineIssue"]{_id,heroMedia,editorLetter}'),
    client.fetch<ZineArticle[]>('*[_type == "article" && articleType == "zine"]{_id,cardCtaLabel}'),
  ])

  let transaction = client.transaction()

  for (const issue of issues) {
    if (!Array.isArray(issue.editorLetter)) continue

    transaction = transaction.patch(issue._id, {
      set: {
        editorLetter: {
          media: issue.heroMedia,
          heading: 'Letter from the Editor',
          body: issue.editorLetter,
          ctaLabel: 'Read the Zine',
        },
      },
    })
  }

  for (const article of articles) {
    if (article.cardCtaLabel) continue

    transaction = transaction.patch(article._id, {
      set: {cardCtaLabel: 'Read more'},
    })
  }

  if (issues.every((issue) => !Array.isArray(issue.editorLetter)) && articles.every((article) => article.cardCtaLabel)) {
    console.log('No Zine landing content required migration.')
    return
  }

  await transaction.commit()
  console.log('Migrated Zine editor letters and article card CTAs.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
