import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-24'})

type IssueToMigrate = {_id: string; title?: string; issueMode?: string; hasPdf: boolean}

// Backfills the Issue Mode flag on zine issues that predate it (defaulting to
// 'full' preserves current behavior) and unsets the removed PDF Asset field.
// Editors flip past zines to 'embed' in the Studio once their ISSUU URLs are
// in place.
async function main() {
  const issues = await client.fetch<Array<IssueToMigrate>>(
    '*[_type == "zineIssue" && (!defined(issueMode) || defined(pdfAsset))]{_id, title, issueMode, "hasPdf": defined(pdfAsset)}',
  )

  if (issues.length === 0) {
    console.log('All zine issues already have an Issue Mode and no PDF asset.')
    return
  }

  console.log(`Migrating ${issues.length} zine issue(s):`)
  for (const issue of issues) {
    console.log(`- ${issue.title ?? issue._id} (mode: ${issue.issueMode ?? 'missing'}, pdf: ${issue.hasPdf})`)
  }

  const transaction = issues.reduce((current, issue) => {
    let patch = current.patch(issue._id)
    if (!issue.issueMode) patch = patch.set({issueMode: 'full'})
    if (issue.hasPdf) patch = patch.unset(['pdfAsset'])
    return patch
  }, client.transaction())

  await transaction.commit()
  console.log('Done. Flip past zines to "ISSUU embed only" in the Studio as needed.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
