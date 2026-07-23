import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-06-01'})

type ZineIssue = {
  _id: string
  cardMedia?: unknown
  heroMedia?: unknown
  coverMedia?: unknown
  editorLetter?: unknown
}

const defaultCardSettings = {
  cardWidth: '1/2',
  mediaAspectRatio: '16:9',
  infoPosition: 'below',
}

async function main() {
  const issues = await client.fetch<ZineIssue[]>(
    '*[_type == "zineIssue"]{_id,cardMedia,heroMedia,coverMedia,editorLetter}',
  )

  if (issues.length === 0) {
    console.log('No Zine Issues required migration.')
    return
  }

  let transaction = client.transaction()

  for (const issue of issues) {
    const set: Record<string, unknown> = {}
    if (!issue.cardMedia && issue.coverMedia) set.cardMedia = issue.coverMedia
    if (!issue.heroMedia && issue.coverMedia) set.heroMedia = issue.coverMedia

    if (
      issue.editorLetter &&
      !Array.isArray(issue.editorLetter) &&
      typeof issue.editorLetter === 'object' &&
      'body' in issue.editorLetter
    ) {
      set.editorLetter = (issue.editorLetter as {body?: unknown}).body
    }

    transaction = transaction.patch(issue._id, {
      set,
      setIfMissing: {listDefaults: defaultCardSettings},
      unset: [
        'issueNumber',
        'publicationDate',
        'coverMedia',
        'coverAspectRatio',
        'introHeadline',
        'introText',
        'introMedia',
      ],
    })
  }

  await transaction.commit()
  console.log(`Migrated ${issues.length} Zine Issue(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
