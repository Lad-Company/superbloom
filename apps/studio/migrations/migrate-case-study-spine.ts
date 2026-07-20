import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-17'})

interface Stat {
  _type: 'stat' | 'caseStudyStat'
  _key?: string
  value: string
  label: string
}

interface MediaBox {
  _type: 'mediaBox'
  asset?: unknown[]
  altText?: string
  decorative?: boolean
}

interface PortableTextBlock {
  _type: string
  children?: unknown[]
  [key: string]: unknown
}

interface BodyBlock {
  _type: string
  _key?: string
  theme?: string
  eyebrow?: string
  statement?: PortableTextBlock[]
  body?: PortableTextBlock[]
  stats?: Stat[]
  layout?: string
  media?: MediaBox[]
  text?: PortableTextBlock[]
  [key: string]: unknown
}

interface NarrativeSection {
  summary?: PortableTextBlock[]
  mediaLayouts?: unknown[]
}

interface Results {
  surfaceRole?: string
  stats?: Stat[]
}

interface Reference {
  _ref?: string
  _id?: string
}

interface CaseStudyDocument {
  _id: string
  _type: string
  title?: string
  slug?: {current?: string}
  body?: BodyBlock[]
  heroMedia?: MediaBox
  client?: string
  primaryColor?: string
  secondaryColor?: string
  capabilities?: Array<{_ref: string}>
  highlights?: NarrativeSection
  challenge?: NarrativeSection
  unexpectedInsight?: NarrativeSection
  bigIdea?: NarrativeSection
  results?: Results
  leadMedia?: MediaBox
  press?: Reference[]
  nextProject?: Reference
  hasBody?: boolean
  year?: string
  industry?: string
  deliverables?: string
  creativeCollective?: string
  [key: string]: unknown
}

function normalizeDraftId(id: string): string {
  return id.replace(/^drafts\./, '')
}

function isMysteryVoyage(doc: CaseStudyDocument): boolean {
  const title = (doc.title || '').toLowerCase().trim()
  const slug = (doc.slug?.current || '').toLowerCase().trim()
  return title === 'mystery voyage' || slug === 'mystery-voyage'
}

function isValidHexColor(color: unknown): boolean {
  return typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)
}

function normalizePortableText(
  text: PortableTextBlock[] | string | undefined
): PortableTextBlock[] | null {
  if (!text) return null

  const blocks = Array.isArray(text) ? text : [{_type: 'block', children: [{_type: 'span', text}]}]

  if (
    blocks.length === 0 ||
    blocks.every(
      (block) =>
        !block.children ||
        (Array.isArray(block.children) &&
          block.children.every((child) => !((child as any)?.text?.trim?.()?.length)))
    )
  ) {
    return null
  }

  return blocks.map((block, i) => ({
    ...block,
    _key: block._key || `block-${i}`,
  }))
}

interface PatchDoc {
  docId: string
  isDelete: boolean
  patch?: (builder: any) => any
}

const narrativeFields = [
  ['highlights', 'highlights'],
  ['challenge', 'challenge'],
  ['unexpected insight', 'unexpectedInsight'],
  ['big idea', 'bigIdea'],
] as const

function mapMediaLayouts(body: BodyBlock[], docId: string) {
  const layouts = new Map<string, unknown[]>()

  for (const block of body.filter((item) => item._type === 'mediaSection')) {
    const destination = block.eyebrow?.trim().toLowerCase()
    const field = narrativeFields.find(([label]) => label === destination)?.[1]
    if (!field) {
      throw new Error(`${docId}: Cannot determine destination for legacy media block ${block._key ?? '(no key)'}`)
    }

    const media = block.media ?? []
    let layout: unknown
    if (block.layout === 'fullBleed16x9' && media.length === 1) {
      layout = {
        _type: 'caseStudyFullBleedMedia',
        _key: block._key ?? `${field}-media`,
        mediaBox: media[0],
      }
    } else if (block.layout === 'pairedSquare' && media.length === 2) {
      layout = {
        _type: 'caseStudyPairedPortraitMedia',
        _key: block._key ?? `${field}-media`,
        mediaBoxes: media,
      }
    } else {
      throw new Error(
        `${docId}: Legacy media block ${block._key ?? '(no key)'} cannot be migrated without guessing`,
      )
    }

    layouts.set(field, [...(layouts.get(field) ?? []), layout])
  }

  return layouts
}

async function main() {
  console.log('Starting Case Study Spine migration...')

  // Fetch all case studies
  const caseStudies = await client.fetch<CaseStudyDocument[]>(
    `*[_type == "caseStudy"] {
      _id,
      title,
      slug,
      body,
      heroMedia,
      leadMedia,
      client,
      primaryColor,
      secondaryColor,
      capabilities,
      highlights,
      challenge,
      unexpectedInsight,
      bigIdea,
      results,
      press,
      nextProject,
      year,
      industry,
      deliverables,
      creativeCollective,
    }`,
  )

  console.log(`Found ${caseStudies.length} case studies`)

  // Identify Mystery Voyage (exclude from contract validation, then delete)
  const mysteryVoyages = caseStudies.filter((doc) => isMysteryVoyage(doc))
  if (mysteryVoyages.length > 1) {
    throw new Error(
      `Found ${mysteryVoyages.length} Mystery Voyage candidates - ambiguous. Stopping.`
    )
  }
  const mysteryVoyageId = mysteryVoyages[0]?._id

  // Validate all documents EXCEPT Mystery Voyage before any mutation
  const validationErrors: string[] = []

  for (const doc of caseStudies) {
    // Skip Mystery Voyage in contract validation - will be deleted
    if (isMysteryVoyage(doc)) {
      console.log(`Excluding Mystery Voyage from contract validation: ${doc._id}`)
      continue
    }

    // Check basic fields
    if (!doc.title || !doc.slug?.current) {
      validationErrors.push(`${doc._id}: Missing title or slug`)
      continue
    }

    if (!doc.client) {
      validationErrors.push(`${doc._id}: Missing client`)
      continue
    }

    if (!isValidHexColor(doc.primaryColor)) {
      validationErrors.push(`${doc._id}: Missing or invalid primaryColor`)
      continue
    }

    // Check capabilities: 1-6 canonical refs
    const capabilities = doc.capabilities ?? []
    if (capabilities.length < 1 || capabilities.length > 6) {
      validationErrors.push(`${doc._id}: Capabilities must be 1-6, found ${capabilities.length}`)
      continue
    }
    const capabilityIds = capabilities.map((capability) => capability._ref).filter(Boolean)
    if (
      capabilityIds.length !== capabilities.length ||
      new Set(capabilityIds).size !== capabilityIds.length
    ) {
      validationErrors.push(`${doc._id}: Capabilities must be unique canonical references`)
    }

    const pressRefs = doc.press ?? []
    const pressIds = pressRefs.map((press) => press._ref).filter(Boolean)
    if (pressRefs.length > 3 || pressIds.length !== pressRefs.length) {
      validationErrors.push(`${doc._id}: Press must contain at most three News references`)
    } else if (new Set(pressIds).size !== pressIds.length) {
      validationErrors.push(`${doc._id}: Press references must be unique`)
    }

    if (
      doc.nextProject?._ref &&
      normalizeDraftId(doc.nextProject._ref) === normalizeDraftId(doc._id)
    ) {
      validationErrors.push(`${doc._id}: Next Project references itself`)
    }

    const spineValues = [
      doc.highlights,
      doc.challenge,
      doc.unexpectedInsight,
      doc.bigIdea,
      doc.results,
    ]
    const populatedSpineFields = spineValues.filter(Boolean).length

    if (populatedSpineFields > 0 && populatedSpineFields < spineValues.length) {
      validationErrors.push(`${doc._id}: Partially migrated Spine cannot be completed safely`)
      continue
    }

    if (populatedSpineFields === spineValues.length) {
      for (const [label, section] of [
        ['Highlights', doc.highlights],
        ['Challenge', doc.challenge],
        ['Unexpected Insight', doc.unexpectedInsight],
        ['Big Idea', doc.bigIdea],
      ] as const) {
        if (!normalizePortableText(section?.summary)) {
          validationErrors.push(`${doc._id}: ${label} summary is empty`)
        }
      }
      const stats = doc.results?.stats ?? []
      if (
        stats.length < 1 ||
        stats.length > 4 ||
        stats.some((stat) => !stat.value?.trim() || !stat.label?.trim())
      ) {
        validationErrors.push(`${doc._id}: Results must contain 1-4 complete stats`)
      }
      if (!['case-primary', 'case-secondary'].includes(doc.results?.surfaceRole ?? '')) {
        validationErrors.push(`${doc._id}: Results surfaceRole is invalid`)
      }
      if (
        doc.results?.surfaceRole === 'case-secondary' &&
        !isValidHexColor(doc.secondaryColor)
      ) {
        validationErrors.push(`${doc._id}: Results requires a valid secondaryColor`)
      }
      if (doc.body || doc.year || doc.industry || doc.deliverables || doc.creativeCollective) {
        console.log(`  ${doc._id}: Already migrated, but legacy fields need cleanup`)
      }
      continue
    }

    // Require body for migration mapping
    if (!doc.body || doc.body.length === 0) {
      validationErrors.push(`${doc._id}: No body content to migrate`)
      continue
    }

    // Find required source blocks for mapping
    const highlights = doc.body.find((b) => b._type === 'highlightsSection')
    const challengeBlock = doc.body.find(
      (b) => b._type === 'textSection' && b.eyebrow?.toLowerCase() === 'challenge'
    )
    const solutionBlock = doc.body.find(
      (b) => b._type === 'textSection' && b.eyebrow?.toLowerCase() === 'solution'
    )
    const outcomes = doc.body.find((b) => b._type === 'statsSection')

    // Map to portable text
    const highlightsSummary = normalizePortableText(highlights?.statement || highlights?.body)
    const challengeSummary = normalizePortableText(challengeBlock?.body)
    const solutionSummary = normalizePortableText(solutionBlock?.body)
    const statsArray = (outcomes?.stats ?? []).map((stat, i) => ({
      _type: 'caseStudyStat',
      _key: stat._key || `stat-${i}`,
      value: stat.value,
      label: stat.label,
    }))

    // Validate required mapped content - ABORT if missing
    if (!highlightsSummary) {
      validationErrors.push(`${doc._id}: Cannot extract non-empty Highlights summary`)
    }
    if (!challengeSummary) {
      validationErrors.push(`${doc._id}: Cannot extract non-empty Challenge summary`)
    }
    if (!solutionSummary) {
      validationErrors.push(`${doc._id}: Cannot extract non-empty Solution summary for Insight/Idea`)
    }
    if (
      statsArray.length < 1 ||
      statsArray.length > 4 ||
      statsArray.some((stat) => !stat.value?.trim() || !stat.label?.trim())
    ) {
      validationErrors.push(`${doc._id}: Results must contain 1-4 complete stats`)
    }

    // Validate secondary color if Results uses case-secondary
    const resultsSurfaceRole = outcomes?.theme
    if (resultsSurfaceRole === 'case-secondary' && !isValidHexColor(doc.secondaryColor)) {
      validationErrors.push(`${doc._id}: Results uses case-secondary but secondaryColor invalid`)
    }

    try {
      mapMediaLayouts(doc.body, doc._id)
    } catch (error) {
      validationErrors.push(error instanceof Error ? error.message : `${doc._id}: Invalid legacy media`)
    }
  }

  if (validationErrors.length > 0) {
    console.error('Validation errors found:')
    validationErrors.forEach((err) => console.error(`  - ${err}`))
    throw new Error('Validation failed - migration aborted')
  }

  // Collect all patches to apply
  const patches: PatchDoc[] = []

  // Handle Mystery Voyage deletion
  if (mysteryVoyageId) {
    console.log(`Queued deletion: ${mysteryVoyageId}`)
    patches.push({docId: mysteryVoyageId, isDelete: true})
  }

  // Build patches for all other docs
  for (const doc of caseStudies) {
    if (isMysteryVoyage(doc)) continue // Already queued for deletion

    // Check if already migrated
    const isAlreadyMigrated =
      doc.highlights &&
      doc.challenge &&
      doc.unexpectedInsight &&
      doc.bigIdea &&
      doc.results

    if (isAlreadyMigrated) {
      // Still need to clean up legacy fields and rename heroMedia
      const hasLegacyFields =
        doc.body || doc.year || doc.industry || doc.deliverables || doc.creativeCollective
      const needsHeroMediaRename = doc.heroMedia && !doc.leadMedia

      if (hasLegacyFields || needsHeroMediaRename) {
        console.log(`Queued legacy cleanup: ${doc._id}`)
        patches.push({
          docId: doc._id,
          isDelete: false,
          patch: (builder) => {
            let patchBuilder = builder
              .unset(['body', 'year', 'industry', 'deliverables', 'creativeCollective', 'heroMedia'])

            if (needsHeroMediaRename) {
              patchBuilder = patchBuilder.set({leadMedia: doc.heroMedia})
            }

            return patchBuilder
          },
        })
      }
      continue
    }

    // Need to migrate - find source blocks
    const highlights = doc.body?.find((b) => b._type === 'highlightsSection')
    const challengeBlock = doc.body?.find(
      (b) => b._type === 'textSection' && b.eyebrow?.toLowerCase() === 'challenge'
    )
    const solutionBlock = doc.body?.find(
      (b) => b._type === 'textSection' && b.eyebrow?.toLowerCase() === 'solution'
    )
    const outcomes = doc.body?.find((b) => b._type === 'statsSection')

    // Map to new structure
    const highlightsSummary = normalizePortableText(highlights?.statement || highlights?.body)
    const challengeSummary = normalizePortableText(challengeBlock?.body)
    const solutionSummary = normalizePortableText(solutionBlock?.body)
    const statsArray = (outcomes?.stats ?? []).map((stat, i) => ({
      _type: 'caseStudyStat',
      _key: stat._key || `stat-${i}`,
      value: stat.value,
      label: stat.label,
    }))
    const mediaLayouts = mapMediaLayouts(doc.body ?? [], doc._id)

    // Determine surface role: Tyson always case-primary, others preserve legacy or default primary
    let surfaceRole = 'case-primary'
    if (doc._id !== 'case-study-tyson' && outcomes?.theme) {
      const validRoles = ['case-primary', 'case-secondary']
      if (validRoles.includes(outcomes.theme)) {
        surfaceRole = outcomes.theme
      }
    }

    const newHighlights = {
      _type: 'caseStudyNarrativeSection',
      summary: highlightsSummary,
      mediaLayouts: mediaLayouts.get('highlights'),
    }

    const newChallenge = {
      _type: 'caseStudyNarrativeSection',
      summary: challengeSummary,
      mediaLayouts: mediaLayouts.get('challenge'),
    }

    const newUnexpectedInsight = {
      _type: 'caseStudyNarrativeSection',
      summary: solutionSummary,
      mediaLayouts: mediaLayouts.get('unexpectedInsight'),
    }

    const newBigIdea = {
      _type: 'caseStudyNarrativeSection',
      summary: solutionSummary,
      mediaLayouts: mediaLayouts.get('bigIdea'),
    }

    const newResults = {
      _type: 'caseStudyResults',
      surfaceRole,
      stats: statsArray,
    }

    console.log(`Queued migration: ${doc._id}`)
    patches.push({
      docId: doc._id,
      isDelete: false,
      patch: (builder) => {
        let patchBuilder = builder
          .set({
            highlights: newHighlights,
            challenge: newChallenge,
            unexpectedInsight: newUnexpectedInsight,
            bigIdea: newBigIdea,
            results: newResults,
          })
          .unset(['body', 'year', 'industry', 'deliverables', 'creativeCollective', 'heroMedia'])

        // Migrate heroMedia to leadMedia if not already present
        if (doc.heroMedia && !doc.leadMedia) {
          patchBuilder = patchBuilder.set({leadMedia: doc.heroMedia})
        }

        return patchBuilder
      },
    })
  }

  if (patches.length === 0) {
    console.log('No documents to migrate.')
    return
  }

  // Apply all patches in a single transaction
  const transaction = client.transaction()
  for (const item of patches) {
    if (item.isDelete) {
      transaction.delete(item.docId)
    } else if (item.patch) {
      transaction.patch(item.docId, item.patch)
    }
  }

  console.log(`\nApplying ${patches.length} changes in a single transaction...`)
  await transaction.commit()
  console.log('Migration committed successfully!')

  // Verify results
  console.log('\nVerifying migration...')
  const migratedDocs = await client.fetch<CaseStudyDocument[]>(
    `*[_type == "caseStudy"] {
      _id,
      title,
      highlights,
      challenge,
      unexpectedInsight,
      bigIdea,
      results,
      press,
      nextProject,
      "hasBody": defined(body),
      year,
      industry,
      deliverables,
      creativeCollective,
      heroMedia,
      primaryColor,
      secondaryColor,
      client,
      capabilities,
    }`,
  )

  // Verification checks
  let verifyPassed = true

  // Check all five spine fields present
  const allSpineFieldsPresent = migratedDocs.every(
    (doc) =>
      doc.highlights &&
      doc.challenge &&
      doc.unexpectedInsight &&
      doc.bigIdea &&
      doc.results
  )
  console.log(`✓ All spine fields present: ${allSpineFieldsPresent}`)
  if (!allSpineFieldsPresent) verifyPassed = false

  // Check no Mystery Voyage
  const noMysteryVoyage = !migratedDocs.some((doc) => isMysteryVoyage(doc))
  console.log(`✓ Mystery Voyage absent: ${noMysteryVoyage}`)
  if (!noMysteryVoyage) verifyPassed = false

  // Check no legacy detail fields
  const noLegacyFields = migratedDocs.every(
    (doc) => !doc.hasBody && !doc.year && !doc.industry && !doc.deliverables && !doc.creativeCollective
  )
  console.log(`✓ Legacy detail fields removed: ${noLegacyFields}`)
  if (!noLegacyFields) verifyPassed = false

  // Check no heroMedia
  const noHeroMedia = migratedDocs.every((doc) => !doc.heroMedia)
  console.log(`✓ heroMedia field removed: ${noHeroMedia}`)
  if (!noHeroMedia) verifyPassed = false

  // Check required colors
  const validColors = migratedDocs.every(
    (doc) =>
      isValidHexColor(doc.primaryColor) &&
      (!doc.results?.surfaceRole || doc.results.surfaceRole !== 'case-secondary' || isValidHexColor(doc.secondaryColor))
  )
  console.log(`✓ Colors valid: ${validColors}`)
  if (!validColors) verifyPassed = false

  // Check results cardinality
  const validStats = migratedDocs.every((doc) => {
    const stats = doc.results?.stats ?? []
    return stats.length >= 1 && stats.length <= 4
  })
  console.log(`✓ Results stats 1-4 count: ${validStats}`)
  if (!validStats) verifyPassed = false

  // Check press cardinality
  const validPress = migratedDocs.every((doc) => {
    const press = doc.press ?? []
    const ids = press.map((item) => item._ref).filter(Boolean)
    return press.length <= 3 && ids.length === press.length && new Set(ids).size === ids.length
  })
  console.log(`✓ Press ≤3 items: ${validPress}`)
  if (!validPress) verifyPassed = false

  // Check capabilities 1-6
  const validCapabilities = migratedDocs.every((doc) => {
    const caps = doc.capabilities ?? []
    return caps.length >= 1 && caps.length <= 6
  })
  console.log(`✓ Capabilities 1-6 count: ${validCapabilities}`)
  if (!validCapabilities) verifyPassed = false

  // Check next project not self
  const validNextProj = migratedDocs.every((doc) => {
    const next = doc.nextProject
    if (!next) return true
    const normalizedRef = normalizeDraftId(next._ref ?? next._id ?? '')
    const normalizedId = normalizeDraftId(doc._id)
    return normalizedRef !== normalizedId
  })
  console.log(`✓ Next Project non-self: ${validNextProj}`)
  if (!validNextProj) verifyPassed = false

  console.log(`\nVerification: ${verifyPassed ? 'PASSED' : 'FAILED'}`)
  if (!verifyPassed) {
    throw new Error('Verification failed - data integrity issue')
  }
}

await main()
