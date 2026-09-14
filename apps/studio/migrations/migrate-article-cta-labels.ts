import {getCliClient} from 'sanity/cli'

/**
 * Rewrites News article `source` values from bare outlet names (e.g. "Vogue")
 * to full footer CTA copy (e.g. "Read on Vogue"), matching the 2026-09-11
 * schema change that renamed the field to "CTA Label" and stopped prefixing
 * the copy in the ArticleDetail component.
 *
 * Covers published documents and drafts (raw perspective). Values already
 * starting with "Read on" (case-insensitive) are left alone, so the script is
 * idempotent. Empty strings are skipped — the frontend fallback
 * ("Read the full story") covers them.
 *
 * Run with --dry-run to review the report without writing.
 */

const client = getCliClient({apiVersion: '2026-07-22'}).withConfig({perspective: 'raw'})
const dryRun = process.argv.includes('--dry-run')

type Article = {_id: string; title?: string; source?: string}

const articles = await client.fetch<Article[]>(
  '*[_type == "article" && articleType == "news" && defined(source) && source != ""]{_id, title, source}',
)

const patches = articles
  .filter((article) => !article.source!.trim().toLowerCase().startsWith('read on'))
  .map((article) => ({
    id: article._id,
    from: article.source!,
    to: `Read on ${article.source!.trim()}`,
  }))

for (const patch of patches) {
  console.log(`  REWRITE ${patch.id}: "${patch.from}" -> "${patch.to}"`)
}
console.log(
  `${patches.length} article(s) to rewrite, ${articles.length - patches.length} already migrated.`,
)

if (dryRun) {
  console.log('Dry run complete. No documents were changed.')
  process.exit(0)
}

if (patches.length === 0) {
  console.log('Nothing to migrate.')
} else {
  await client.mutate(
    patches.map((patch) => ({patch: {id: patch.id, set: {source: patch.to}}})) as never,
  )
  console.log(`Applied ${patches.length} CTA label rewrite(s).`)
}
