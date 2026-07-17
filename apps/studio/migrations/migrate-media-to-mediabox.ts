import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-17'})

interface Reference {
  _type: 'reference'
  _ref: string
}

interface ImageMedia {
  _type: 'image'
  _key?: string
  asset?: Reference
  altText?: string
  crop?: unknown
  hotspot?: unknown
}

interface VideoMedia {
  _type: 'mux.video'
  _key?: string
  asset?: Reference
}

type LegacyMedia = ImageMedia | VideoMedia

interface MediaBox {
  _type: 'mediaBox'
  _key?: string
  asset: LegacyMedia[]
  altText?: string
  decorative: boolean
}

interface Document {
  _id: string
  _type: string
  [key: string]: unknown
}

const isMediaBox = (value: unknown): value is MediaBox =>
  Boolean(value && typeof value === 'object' && '_type' in value && value._type === 'mediaBox')

const firstLegacyMedia = (value: unknown): LegacyMedia | null => {
  const media = Array.isArray(value) ? value[0] : value
  if (!media || typeof media !== 'object' || !('_type' in media) || !('asset' in media)) return null
  if (media._type !== 'image' && media._type !== 'mux.video') return null
  return media as LegacyMedia
}

const imageAltText = new Map(
  await client.fetch<Array<{_id: string; altText: string}>>(
    `*[_type == "sanity.imageAsset" && defined(altText)]{_id, altText}`,
  ).then((assets) => assets.map((asset) => [asset._id, asset.altText])),
)

const toMediaBox = (value: unknown, key?: string): MediaBox | null => {
  if (isMediaBox(value)) return value

  const media = firstLegacyMedia(value)
  if (!media?.asset?._ref) return null

  const altText =
    media._type === 'image'
      ? media.altText ?? imageAltText.get(media.asset._ref)
      : undefined

  return {
    _type: 'mediaBox',
    ...(key ? {_key: key} : {}),
    asset: [{...media, _key: media._key ?? 'asset'}],
    ...(altText ? {altText} : {}),
    decorative: media._type === 'image' && !altText,
  }
}

const normalizeMediaBox = (mediaBox: MediaBox, key?: string): MediaBox => ({
  ...mediaBox,
  ...(key && !mediaBox._key ? {_key: key} : {}),
  asset: mediaBox.asset.map((asset, index) => ({
    ...asset,
    _key: asset._key ?? (index === 0 ? 'asset' : `asset-${index}`),
  })),
})

const needsNormalization = (mediaBox: MediaBox, key?: string) =>
  Boolean((key && !mediaBox._key) || mediaBox.asset.some((asset) => !asset._key))

const transaction = client.transaction()
let mutationCount = 0
const dryRun = process.argv.includes('--dry-run')

const patch = (id: string, operation: Parameters<typeof transaction.patch>[1]) => {
  transaction.patch(id, operation)
  mutationCount += 1
}

try {
  console.log('Fetching documents to migrate...')

  const homepage = await client.fetch<Document | null>(`*[_type == "homepage"][0]`)
  if (homepage) {
    const sections = homepage.sections as Array<{
      _key?: string
      _type: string
      video?: LegacyMedia
      heroMedia?: MediaBox
    }> | undefined
    for (let i = 0; i < (sections ?? []).length; i++) {
      const section = sections![i]
      if (section._type !== 'heroBlock') continue
      const path = section._key ? `sections[_key=="${section._key}"]` : `sections[${i}]`
      const mediaBox = section.heroMedia ?? toMediaBox(section.video)
      if (mediaBox && (section.video || needsNormalization(mediaBox))) {
        patch(homepage._id, (builder) =>
          builder
            .set({[`${path}.heroMedia`]: normalizeMediaBox(mediaBox)})
            .unset([`${path}.video`]),
        )
      }
    }
  }

  const capabilities = await client.fetch<Document[]>(`*[_type == "capability"]`)
  for (const cap of capabilities) {
    const {video, media} = cap as {video?: LegacyMedia; media?: MediaBox}
    const mediaBox = media ?? toMediaBox(video)
    if (mediaBox && (video || needsNormalization(mediaBox))) {
      patch(cap._id, (builder) =>
        builder.set({media: normalizeMediaBox(mediaBox)}).unset(['video']),
      )
    }
  }

  const caseStudies = await client.fetch<Document[]>(`*[_type == "caseStudy"]`)
  for (const cs of caseStudies) {
    const caseStudy = cs as {
      cardMedia?: LegacyMedia[] | MediaBox
      heroVideo?: LegacyMedia
      heroMedia?: MediaBox
    }
    const cardMedia = isMediaBox(caseStudy.cardMedia)
      ? caseStudy.cardMedia
      : toMediaBox(caseStudy.cardMedia)
    if (
      cardMedia &&
      (!isMediaBox(caseStudy.cardMedia) || needsNormalization(cardMedia))
    ) {
      patch(cs._id, (builder) => builder.set({cardMedia: normalizeMediaBox(cardMedia)}))
    }

    const heroVideo = caseStudy.heroVideo
    const heroMedia = caseStudy.heroMedia ?? toMediaBox(heroVideo)
    if (heroMedia && (heroVideo || needsNormalization(heroMedia))) {
      patch(cs._id, (builder) =>
        builder.set({heroMedia: normalizeMediaBox(heroMedia)}).unset(['heroVideo']),
      )
    }
  }

  const newsItems = await client.fetch<Document[]>(`*[_type == "news"]`)
  for (const newsItem of newsItems) {
    const media = (newsItem as {media?: LegacyMedia[] | MediaBox}).media
    const mediaBox = isMediaBox(media) ? media : toMediaBox(media)
    if (mediaBox && (!isMediaBox(media) || needsNormalization(mediaBox))) {
      patch(newsItem._id, (builder) => builder.set({media: normalizeMediaBox(mediaBox)}))
    }
  }

  const whoWeAre = await client.fetch<Document | null>(`*[_type == "whoWeAre"][0]`)
  if (whoWeAre) {
    const featured = (whoWeAre as {featuredMedia?: {media?: LegacyMedia[] | MediaBox}})
      .featuredMedia?.media
    const featuredMedia = isMediaBox(featured) ? featured : toMediaBox(featured)
    if (featuredMedia && (!isMediaBox(featured) || needsNormalization(featuredMedia))) {
      patch(whoWeAre._id, (builder) =>
        builder.set({'featuredMedia.media': normalizeMediaBox(featuredMedia)}),
      )
    }

    const advantageBlocks = (whoWeAre as {
      advantageBlocks?: Array<{_key: string; media?: LegacyMedia[] | MediaBox}>
    })
      .advantageBlocks ?? []
    for (const block of advantageBlocks) {
      const mediaBox = isMediaBox(block.media) ? block.media : toMediaBox(block.media)
      if (mediaBox && (!isMediaBox(block.media) || needsNormalization(mediaBox))) {
        patch(whoWeAre._id, (builder) =>
          builder.set({
            [`advantageBlocks[_key=="${block._key}"].media`]: normalizeMediaBox(mediaBox),
          }),
        )
      }
    }

    const ctas = (whoWeAre as {
      ctas?: Array<{_key: string; media?: LegacyMedia[] | MediaBox}>
    }).ctas ?? []
    for (const cta of ctas) {
      const mediaBox = isMediaBox(cta.media) ? cta.media : toMediaBox(cta.media)
      if (mediaBox && (!isMediaBox(cta.media) || needsNormalization(mediaBox))) {
        patch(whoWeAre._id, (builder) =>
          builder.set({[`ctas[_key=="${cta._key}"].media`]: normalizeMediaBox(mediaBox)}),
        )
      }
    }
  }

  const allDocs = await client.fetch<Document[]>(
    `*[_type == "caseStudy" || _type == "news"] {_id, body}`,
  )
  for (const doc of allDocs) {
    const body = (doc as {
      body?: Array<{_type: string; _key: string; media?: Array<LegacyMedia | MediaBox>}>
    }).body ?? []
    for (let i = 0; i < body.length; i++) {
      const block = body[i]
      if (block._type === 'mediaSection' && block.media && Array.isArray(block.media)) {
        const newMediaArray = block.media
          .map((item, itemIndex) =>
            isMediaBox(item)
              ? normalizeMediaBox(item, item._key ?? `media-${itemIndex}`)
              : toMediaBox(item, item._key ?? `media-${itemIndex}`),
          )
          .filter((item): item is MediaBox => item !== null)

        const requiresUpdate =
          !block.media.every(isMediaBox) ||
          block.media.some((item, itemIndex) =>
            isMediaBox(item)
              ? needsNormalization(item, item._key ?? `media-${itemIndex}`)
              : true,
          )

        if (newMediaArray.length > 0 && requiresUpdate) {
          const path = block._key ? `body[_key=="${block._key}"].media` : `body[${i}].media`
          patch(doc._id, (builder) => builder.set({[path]: newMediaArray}))
        }
      }
    }
  }

  if (mutationCount === 0) {
    console.log('No media content requires migration.')
  } else if (dryRun) {
    console.log(`Dry run complete. ${mutationCount} document patches would be applied.`)
  } else {
    console.log(`Committing ${mutationCount} document patches...`)
    await transaction.commit()
    console.log('Migration completed.')
  }
} catch (error) {
  console.error('Migration failed:', error)
  throw error
}
