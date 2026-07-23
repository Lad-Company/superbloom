import {getCliClient} from 'sanity/cli'
import {
  migrateLegacyCaseStudyBlock,
  type LegacyCaseStudyBlock,
} from '../../../packages/schemas/src/caseStudyMigration.ts'

type CaseStudy = {
  _id: string
  title?: string
  publicationDate?: string
  requiresMigration: boolean
  highlights?: {
    summary?: unknown
    mediaLayouts?: Array<LegacyCaseStudyBlock | Record<string, unknown>>
  }
  challenge?: {
    summary?: unknown
    mediaLayouts?: Array<LegacyCaseStudyBlock | Record<string, unknown>>
  }
  unexpectedInsight?: {
    summary?: unknown
    mediaLayouts?: Array<LegacyCaseStudyBlock | Record<string, unknown>>
  }
  bigIdea?: {
    summary?: unknown
    mediaLayouts?: Array<LegacyCaseStudyBlock | Record<string, unknown>>
  }
  results?: {
    backgroundColor?: string
    surfaceRole?: 'case-primary' | 'case-secondary'
    stats?: unknown
    supportingRows?: Array<LegacyCaseStudyBlock | Record<string, unknown>>
  }
}

const client = getCliClient({apiVersion: '2026-07-22'})
const dryRun = process.argv.includes('--dry-run')

const query = `*[_type == "caseStudy"]{
  _id,
  title,
  publicationDate,
  "requiresMigration":
    count(highlights.mediaLayouts[_type in ["caseStudyFullBleedMedia", "caseStudyTextMedia", "caseStudyPairedPortraitMedia"]]) > 0 ||
    count(challenge.mediaLayouts[_type in ["caseStudyFullBleedMedia", "caseStudyTextMedia", "caseStudyPairedPortraitMedia"]]) > 0 ||
    count(unexpectedInsight.mediaLayouts[_type in ["caseStudyFullBleedMedia", "caseStudyTextMedia", "caseStudyPairedPortraitMedia"]]) > 0 ||
    count(bigIdea.mediaLayouts[_type in ["caseStudyFullBleedMedia", "caseStudyTextMedia", "caseStudyPairedPortraitMedia"]]) > 0 ||
    count(results.supportingRows[_type in ["caseStudyFullBleedMedia", "caseStudyTextMedia", "caseStudyPairedPortraitMedia"]]) > 0 ||
    defined(results.surfaceRole),
  highlights,
  challenge,
  unexpectedInsight,
  bigIdea,
  results
}`

const caseStudies = await client.fetch<CaseStudy[]>(query)

const failedMigrations: {id: string; title?: string; error: string}[] = []
const missingPublicationDates = caseStudies.filter((caseStudy) => !caseStudy.publicationDate)
const transaction = client.transaction()
let migrationCount = 0

for (const caseStudy of caseStudies) {
  if (!caseStudy.requiresMigration) continue
  try {
    const patches: Record<string, unknown> = {}

    const sections = ['highlights', 'challenge', 'unexpectedInsight', 'bigIdea'] as const
    for (const section of sections) {
      const sectionData = caseStudy[section]
      if (sectionData?.mediaLayouts) {
        const migratedLayouts = sectionData.mediaLayouts.map((block) =>
          block._type === 'caseStudyFullBleedMedia' ||
          block._type === 'caseStudyTextMedia' ||
          block._type === 'caseStudyPairedPortraitMedia'
            ? migrateLegacyCaseStudyBlock(block as LegacyCaseStudyBlock)
            : block,
        )
        patches[section] = {...sectionData, mediaLayouts: migratedLayouts}
      }
    }

    if (caseStudy.results) {
      const {surfaceRole, ...results} = caseStudy.results
      const supportingRows = results.supportingRows?.map((block) =>
        block._type === 'caseStudyFullBleedMedia' ||
        block._type === 'caseStudyTextMedia' ||
        block._type === 'caseStudyPairedPortraitMedia'
          ? migrateLegacyCaseStudyBlock(block as LegacyCaseStudyBlock)
          : block,
      )
      patches.results = {
        ...results,
        ...(surfaceRole
          ? {backgroundColor: surfaceRole === 'case-secondary' ? 'secondary' : 'primary'}
          : {}),
        ...(supportingRows ? {supportingRows} : {}),
      }
    }

    if (Object.keys(patches).length > 0) {
      transaction.patch(caseStudy._id, (patch) => patch.set(patches))
      migrationCount += 1
    }
  } catch (error) {
    failedMigrations.push({
      id: caseStudy._id,
      title: caseStudy.title,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

if (dryRun) {
  console.log(
    `Dry run complete. ${migrationCount} Case Study document(s) would be migrated.`,
  )
  for (const cs of caseStudies.filter((caseStudy) => caseStudy.requiresMigration)) {
    const failed = failedMigrations.find((f) => f.id === cs._id)
    if (failed) {
      console.log(`✗ ${cs._id}: ${cs.title ?? 'Untitled'} - ${failed.error}`)
    } else {
      console.log(`✓ ${cs._id}: ${cs.title ?? 'Untitled'}`)
    }
  }
} else if (failedMigrations.length > 0) {
  console.error(`Migration blocked: ${failedMigrations.length} document(s) failed to migrate:`)
  for (const failed of failedMigrations) {
    console.error(`  ✗ ${failed.id}: ${failed.title ?? 'Untitled'} - ${failed.error}`)
  }
  process.exitCode = 1
} else if (migrationCount > 0) {
  await transaction.commit()
  console.log(`Migrated ${migrationCount} Case Study document(s).`)
} else {
  console.log('No legacy Case Study narrative section blocks require migration.')
}

if (missingPublicationDates.length > 0) {
  console.error('Case Studies requiring an accurate Publication Date:')
  for (const caseStudy of missingPublicationDates) {
    console.error(`- ${caseStudy._id}: ${caseStudy.title ?? 'Untitled'}`)
  }
  if (!dryRun) process.exitCode = 1
}
