import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-22'})
const workIndexId = 'workIndex'
const defaults = {
  cardWidth: '1/2',
  mediaAspectRatio: '16:9',
  infoPosition: 'below',
} as const
const maxFeaturedCaseStudies = 4

type CardSettings = {
  cardWidth?: '1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'full'
  mediaAspectRatio?: '1:1' | '4:5' | '16:9' | '2:1'
  infoPosition?: 'below' | 'left' | 'right'
}
type WorkIndexDocument = {
  _id: string
  heroHeading?: string
  allWorkHeading?: string
  featured?: unknown[]
  allSection?: {listDefaults?: CardSettings; [key: string]: unknown}
}
type LegacyWorkCaseStudy = {
  _id: string
  orderRank?: string
  cardSize?: 'full' | 'half'
  cardAspectRatio?: CardSettings['mediaAspectRatio']
} & CardSettings

function migrateLegacyWorkCard(caseStudy: LegacyWorkCaseStudy): Required<CardSettings> {
  return {
    cardWidth:
      caseStudy.cardWidth ?? (caseStudy.cardSize === 'full' ? 'full' : defaults.cardWidth),
    mediaAspectRatio:
      caseStudy.mediaAspectRatio ?? caseStudy.cardAspectRatio ?? defaults.mediaAspectRatio,
    infoPosition: caseStudy.infoPosition ?? defaults.infoPosition,
  }
}

function migrateLegacyWorkIndex(
  page: Omit<WorkIndexDocument, '_id' | 'heroHeading' | 'allWorkHeading'>,
  rankedCaseStudies: LegacyWorkCaseStudy[],
) {
  const allSection = page.allSection ?? {}
  const seen = new Set<string>()

  return {
    featured:
      Array.isArray(page.featured) && page.featured.length > 0
        ? page.featured
        : rankedCaseStudies.flatMap((caseStudy, index) => {
            if (
              !caseStudy.orderRank ||
              seen.has(caseStudy._id) ||
              seen.size === maxFeaturedCaseStudies
            )
              return []
            seen.add(caseStudy._id)

            return [
              {
                _key: `migrated-featured-${index + 1}`,
                _type: 'featuredCaseStudy',
                caseStudy: {_type: 'reference', _ref: caseStudy._id},
                ...migrateLegacyWorkCard(caseStudy),
              },
            ]
          }),
    allSection: {
      ...allSection,
      listDefaults: {...defaults, ...allSection.listDefaults},
    },
  }
}

async function main() {
  const [workIndex, caseStudies] = await Promise.all([
    client.fetch<WorkIndexDocument | null>(
      '*[_id == $id][0]{_id,heroHeading,allWorkHeading,featured,allSection}',
      {id: workIndexId},
    ),
    client.fetch<LegacyWorkCaseStudy[]>(
      '*[_type == "caseStudy" && (defined(orderRank) || defined(cardSize) || defined(cardAspectRatio))] | order(orderRank asc){_id,orderRank,cardSize,cardAspectRatio,cardWidth,mediaAspectRatio,infoPosition}',
    ),
  ])
  const fields = migrateLegacyWorkIndex(workIndex ?? {}, caseStudies)

  if (!workIndex) {
    await client.create({
      _id: workIndexId,
      _type: 'workIndex',
      heroHeading: 'Unexpected minds. Unignorable work.',
      allWorkHeading: 'All work',
      ...fields,
    })
  } else {
    await client.patch(workIndexId).set(fields).commit()
  }

  if (caseStudies.length > 0) {
    const transaction = caseStudies.reduce(
      (current, caseStudy) =>
        current.patch(caseStudy._id, {
          setIfMissing: migrateLegacyWorkCard(caseStudy),
          unset: ['orderRank', 'cardSize', 'cardAspectRatio'],
        }),
      client.transaction(),
    )
    await transaction.commit()
  }

  console.log(
    `Migrated Work Index and removed legacy presentation fields from ${caseStudies.length} Case Stud${caseStudies.length === 1 ? 'y' : 'ies'}.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
