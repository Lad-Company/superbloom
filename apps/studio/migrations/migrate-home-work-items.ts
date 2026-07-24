import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-24'}).withConfig({perspective: 'raw'})

type CardSettings = {
  cardWidth: '1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'full'
  mediaAspectRatio: 'intrinsic' | '1:1' | '4:5' | '9:16' | '3:2' | '16:9' | '2:1'
  infoPosition: 'below' | 'left' | 'right'
}

const defaults: CardSettings = {
  cardWidth: '1/2',
  mediaAspectRatio: '16:9',
  infoPosition: 'below',
} as const

type LegacyReference = {
  _key: string
  _type: 'reference'
  _ref: string
}

type HomeWorkItem = LegacyReference | {
  _key: string
  _type: 'homeCaseStudy'
  caseStudy: {_ref: string}
  cardWidth?: CardSettings['cardWidth']
  mediaAspectRatio?: CardSettings['mediaAspectRatio']
  infoPosition?: CardSettings['infoPosition']
}

type Homepage = {
  _id: string
  work?: {items?: HomeWorkItem[]}
}

type CaseStudy = {
  _id: string
  cardWidth?: CardSettings['cardWidth']
  mediaAspectRatio?: CardSettings['mediaAspectRatio']
  infoPosition?: CardSettings['infoPosition']
}

async function main() {
  const homepages = await client.fetch<Homepage[]>(
    '*[_id in ["homepage", "drafts.homepage"]]{_id, work{items}}',
  )

  const migrations = homepages
    .map((homepage) => ({
      homepage,
      legacyItems:
        homepage.work?.items?.filter(
          (item): item is LegacyReference => item._type === 'reference',
        ) ?? [],
    }))
    .filter(({legacyItems}) => legacyItems.length > 0)

  if (migrations.length === 0) {
    console.log('No legacy Homepage Our Work references found.')
    return
  }

  const caseStudies = await client.fetch<CaseStudy[]>(
    '*[_id in $ids]{_id, cardWidth, mediaAspectRatio, infoPosition}',
    {ids: migrations.flatMap(({legacyItems}) => legacyItems.map((item) => item._ref))},
  )
  const settingsById = new Map(caseStudies.map((caseStudy) => [caseStudy._id, caseStudy]))

  const transaction = migrations.reduce((current, {homepage}) => {
    const items = homepage.work?.items?.map((item) => {
      if (item._type !== 'reference') return item

      const settings = settingsById.get(item._ref)
      return {
        _key: item._key,
        _type: 'homeCaseStudy',
        caseStudy: {_type: 'reference', _ref: item._ref},
        cardWidth: settings?.cardWidth ?? defaults.cardWidth,
        mediaAspectRatio: settings?.mediaAspectRatio ?? defaults.mediaAspectRatio,
        infoPosition: settings?.infoPosition ?? defaults.infoPosition,
      }
    })

    return current.patch(homepage._id, {set: {'work.items': items}})
  }, client.transaction())

  await transaction.commit()
  console.log(
    `Migrated ${migrations.reduce((count, {legacyItems}) => count + legacyItems.length, 0)} Homepage Our Work item(s).`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
