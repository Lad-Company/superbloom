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
type CardDocument = {
  _id: string
  _type: 'article' | 'caseStudy'
  cardAspectRatio?: string
  cardSize?: string
  isExternal?: boolean
  externalUrl?: string
}
type ConfigDocument = {_id: string; _type: 'indexPage' | 'workIndex' | 'siteSettings'}

const defaultCardSettings = {
  cardWidth: '1/2',
  mediaAspectRatio: '16:9',
  infoPosition: 'below',
}

const withoutArrayKey = (section: HomepageSection) => {
  const {_key, ...value} = section
  return value
}

async function main() {
  const [homepages, zineIssues, cardDocuments, configDocuments] = await Promise.all([
    client.fetch<Homepage[]>(
      '*[_type == "homepage"]{_id,sections,hero,capabilities,news,zine,contact}',
    ),
    client.fetch<ZineIssue[]>(
      '*[_type == "zineIssue"]{_id,cardMedia,heroMedia,coverMedia,editorLetter}',
    ),
    client.fetch<CardDocument[]>(
      '*[_type in ["article", "caseStudy"]]{_id,_type,cardAspectRatio,cardSize,isExternal,externalUrl}',
    ),
    client.fetch<ConfigDocument[]>(
      '*[_type in ["indexPage", "workIndex", "siteSettings"]]{_id,_type}',
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
      setIfMissing: {'news.listDefaults': defaultCardSettings},
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

  for (const document of cardDocuments) {
    const mediaAspectRatio = document.cardAspectRatio ?? defaultCardSettings.mediaAspectRatio
    const cardWidth =
      document._type === 'caseStudy' && document.cardSize === 'full'
        ? 'full'
        : defaultCardSettings.cardWidth
    const setIfMissing: Record<string, unknown> = {
      cardWidth,
      mediaAspectRatio,
      infoPosition: defaultCardSettings.infoPosition,
    }

    if (document._type === 'article') {
      setIfMissing.cardDestination = document.isExternal ? 'external' : 'internal'
      if (document.isExternal && document.externalUrl) {
        setIfMissing.externalCoverage = [
          {
            _key: `migrated-${document._id}`,
            _type: 'externalCoverage',
            outlet: 'External coverage',
            url: document.externalUrl,
            isPrimary: true,
          },
        ]
      }
    }

    transaction = transaction.patch(document._id, {
      setIfMissing,
      unset: ['cardAspectRatio', 'cardSize', 'isExternal', 'externalUrl', 'orderRank'],
    })
  }

  for (const document of configDocuments) {
    if (document._type === 'siteSettings') {
      transaction = transaction.patch(document._id, {
        setIfMissing: {cardDefaults: defaultCardSettings},
      })
    } else {
      transaction = transaction.patch(document._id, {
        setIfMissing: {
          featured: [],
          'allSection.listDefaults': defaultCardSettings,
        },
        unset: document._type === 'indexPage' ? ['lead', 'secondary'] : [],
      })
    }
  }

  if (
    homepages.length === 0 &&
    zineIssues.length === 0 &&
    cardDocuments.length === 0 &&
    configDocuments.length === 0
  ) {
    console.log('No CMS documents required migration.')
    return
  }

  await transaction.commit()
  console.log(
    `Migrated ${homepages.length} homepage, ${zineIssues.length} zine issue, ${cardDocuments.length} card, and ${configDocuments.length} configuration document(s).`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
