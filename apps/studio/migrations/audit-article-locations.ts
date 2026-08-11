import {getCliClient} from 'sanity/cli'
// Explicit .ts extension: `sanity exec` runs through Node's native TS
// loader, which does not resolve extensionless relative imports.
import {ARTICLE_LOCATIONS_QUERY, resolveArticleLocations} from '../articleLocations.ts'

const client = getCliClient({apiVersion: '2026-06-01'})

type Sample = {_id: string; title?: string; articleType?: string}

// Regression guard for the Presentation "Resolving locations..." hang: the
// article location resolver used to embed this reverse lookup in a
// `defineLocations` select, which the preview store mangles into invalid
// GROQ (select values are field paths, not expressions), failing every
// fetch forever. This script runs the resolver's exact query for one
// article of each type and checks the mapped location, so a broken or
// regressed resolver fails loudly here instead of spinning in the editor.
async function main() {
  const samples = await client.fetch<Sample[]>(
    `*[_type == "article" && !(_id in path("drafts.**")) && articleType in ["news", "editorial", "zine"]]
      | order(articleType asc) { _id, title, articleType }`,
  )
  const byType = new Map(samples.map((sample) => [sample.articleType, sample]))

  const failures: string[] = []

  for (const articleType of ['news', 'editorial', 'zine']) {
    const sample = byType.get(articleType)
    if (!sample) {
      console.log(`No published ${articleType} article to audit — skipping.`)
      continue
    }
    const doc = await client.fetch(ARTICLE_LOCATIONS_QUERY, {id: sample._id})
    if (!doc) {
      failures.push(`${articleType}: resolver query returned nothing for ${sample._id}`)
      continue
    }
    const {locations} = resolveArticleLocations(doc)
    const href = locations?.[0]?.href
    const expected =
      articleType === 'news'
        ? '/index'
        : articleType === 'editorial'
          ? `/articles/${doc.slug}`
          : `/zine/issues/${doc.issueSlug}/${doc.slug}`
    if (href !== expected) {
      failures.push(
        `${articleType}: ${sample.title ?? sample._id} resolved to ${href ?? '(none)'}, expected ${expected}`,
      )
    } else {
      console.log(`${articleType}: "${sample.title}" -> ${href}`)
    }
  }

  if (failures.length > 0) {
    throw new Error(`Article location audit failed:\n${failures.join('\n')}`)
  }
  console.log('Article location audit passed.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
