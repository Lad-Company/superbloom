import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-06-01'})

type HomepageSection = {_key?: string; _type?: string; [key: string]: unknown}
type Homepage = {
  _id: string
  sections?: HomepageSection[]
  hero?: unknown
  capabilities?: unknown
  news?: unknown
  zine?: unknown
  contact?: unknown
}
type ZineIssue = {
  _id: string
  cardMedia?: unknown
  heroMedia?: unknown
  coverMedia?: unknown
  editorLetter?: unknown
}

const withoutArrayKey = (section: HomepageSection) => {
  const {_key, ...value} = section
  return value
}

async function main() {
  const [homepages, zineIssues] = await Promise.all([
    client.fetch<Homepage[]>(
      '*[_type == "homepage" && defined(sections)]{_id,sections,hero,capabilities,news,zine,contact}',
    ),
    client.fetch<ZineIssue[]>(
      '*[_type == "zineIssue"]{_id,cardMedia,heroMedia,coverMedia,editorLetter}',
    ),
  ])

  let transaction = client.transaction()

  for (const homepage of homepages) {
    const sections = homepage.sections ?? []
    const sectionFor = (type: string) => sections.find((section) => section._type === type)
    const set: Record<string, unknown> = {}

    if (!homepage.hero && sectionFor('heroBlock')) {
      set.hero = withoutArrayKey(sectionFor('heroBlock')!)
    }
    if (!homepage.capabilities && sectionFor('capesBlock')) {
      set.capabilities = withoutArrayKey(sectionFor('capesBlock')!)
    }
    if (!homepage.news && sectionFor('newsBlock')) {
      set.news = withoutArrayKey(sectionFor('newsBlock')!)
    }
    if (!homepage.zine && sectionFor('homeZine')) {
      set.zine = withoutArrayKey(sectionFor('homeZine')!)
    }
    if (!homepage.contact && sectionFor('contactBlock')) {
      set.contact = withoutArrayKey(sectionFor('contactBlock')!)
    }

    transaction = transaction.patch(homepage._id, {
      set,
      unset: ['sections'],
    })
  }

  for (const issue of zineIssues) {
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
      unset: [
        'issueNumber',
        'publicationDate',
        'coverMedia',
        'coverAspectRatio',
        'introHeadline',
        'introText',
        'introMedia',
        'pdfAsset',
      ],
    })
  }

  if (homepages.length === 0 && zineIssues.length === 0) {
    console.log('No CMS documents required migration.')
    return
  }

  await transaction.commit()
  console.log(`Migrated ${homepages.length} homepage and ${zineIssues.length} zine issue document(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
