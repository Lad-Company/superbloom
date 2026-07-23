import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import type {ManifestField, ManifestProvenance, RetrievedMedia, StarterCandidate, StarterManifest} from './types'

const CASE_STUDY_TITLES = ['Tyson', 'Silversea', 'Deel', 'Simon Malls', 'Voodoo Ranger', 'Jimmy Dean'] as const
const CARD_WIDTHS = new Set(['1/4', '1/3', '1/2', '2/3', '3/4', 'full'])
const MEDIA_ASPECT_RATIOS = new Set(['intrinsic', '1:1', '4:5', '9:16', '3:2', '16:9', '2:1'])
const INFO_POSITIONS = new Set(['below', 'left', 'right'])
const HEX_COLOR = /^#[0-9a-f]{6}$/i

type Reference = {_type: 'reference'; _ref: string}
type KeyedReference = Reference & {_key: string}

export type ResolvedCaseStudy = {
  document: {
    _id: string
    _type: 'caseStudy'
    title: string
    slug: {_type: 'slug'; current: string}
    client: string
    summary: string
    capabilities: KeyedReference[]
    tags?: KeyedReference[]
    publicationDate: string
    cardMedia: MediaBox
    cardWidth: string
    mediaAspectRatio: string
    infoPosition: string
    primaryColor: {hex: string}
    secondaryColor?: {hex: string}
    leadMedia?: MediaBox
    highlights: NarrativeSection
    challenge: NarrativeSection
    unexpectedInsight: NarrativeSection
    bigIdea: NarrativeSection
    results: Results
    press?: KeyedReference[]
    nextProject: Reference
  }
  media: Array<{checksum: string; field: 'cardMedia' | 'leadMedia'; provenance: ManifestProvenance}>
  fieldProvenance: Record<string, ManifestProvenance>
  inferredFields: Array<{path: string; rationale: string}>
}

type MediaBox = {
  _type: 'mediaBox'
  asset: [MediaAsset]
  altText: string
}

type MediaAsset =
  | {_type: 'image'; _key: string; asset: Reference}
  | {_type: 'mux.video'; _key: string; asset: Reference}

type NarrativeSection = {
  _type: 'caseStudyNarrativeSection'
  summary: [{
    _type: 'block'
    _key: string
    style: 'normal'
    children: [{_type: 'span'; _key: string; text: string; marks: []}]
    markDefs: []
  }]
}

type Results = {
  _type: 'caseStudyResults'
  backgroundColor: 'primary' | 'secondary'
  stats: Array<{_type: 'caseStudyStat'; _key: string; value: string; label: string}>
}

export function resolveCaseStudies(
  manifest: StarterManifest,
  retrievedMedia: RetrievedMedia[],
): ResolvedCaseStudy[] {
  const candidates = new Map(
    manifest.candidates
      .filter((candidate) => candidate.documentType === 'caseStudy')
      .map((candidate) => [requiredString(candidate, 'title'), candidate]),
  )
  if (candidates.size !== CASE_STUDY_TITLES.length) {
    throw new Error(`Case Study resolution requires exactly ${CASE_STUDY_TITLES.length} Case Studies.`)
  }

  const mediaByChecksum = new Map(retrievedMedia.map((media) => [media.checksum, media]))
  return CASE_STUDY_TITLES.map((title, index) => {
    const candidate = candidates.get(title)
    if (!candidate) throw new Error(`Missing required Case Study: ${title}.`)
    return resolveCaseStudy(candidate, manifest, mediaByChecksum, CASE_STUDY_TITLES[(index + 1) % CASE_STUDY_TITLES.length])
  })
}

const seedDirectory = resolve(import.meta.dirname, '..')
const generatedDirectory = resolve(seedDirectory, 'generated')

export async function resolveCaseStudiesFromFiles({
  manifestPath = resolve(generatedDirectory, 'starter-manifest.json'),
  retrievedMediaPath = resolve(generatedDirectory, 'retrieved-media-manifest.json'),
  outputPath = resolve(generatedDirectory, 'resolved-case-studies.json'),
}: {
  manifestPath?: string
  retrievedMediaPath?: string
  outputPath?: string
} = {}): Promise<ResolvedCaseStudy[]> {
  const [manifest, retrievedMedia] = await Promise.all([
    readJson<StarterManifest>(manifestPath),
    readJson<RetrievedMedia[]>(retrievedMediaPath),
  ])
  const resolved = resolveCaseStudies(manifest, retrievedMedia)
  await mkdir(resolve(outputPath, '..'), {recursive: true})
  await writeFile(outputPath, `${JSON.stringify(resolved, null, 2)}\n`)
  return resolved
}

function resolveCaseStudy(
  candidate: StarterCandidate,
  manifest: StarterManifest,
  mediaByChecksum: Map<string, RetrievedMedia>,
  nextTitle: string,
): ResolvedCaseStudy {
  const {fields} = candidate
  const title = requiredString(candidate, 'title')
  const slug = slugify(optionalString(fields.slug) ?? title)
  const id = `case-study-${slug}`
  const cardMedia = mediaBox(candidate.targetId, 'cardMedia', manifest, mediaByChecksum)
  if (!cardMedia) throw new Error(`${candidate.targetId}.cardMedia requires retrieved project media.`)
  const leadMedia = mediaBox(candidate.targetId, 'leadMedia', manifest, mediaByChecksum, false)
  const primaryColor = color(requiredString(candidate, 'primaryColor'), 'primaryColor')
  const secondaryColorValue = optionalString(fields.secondaryColor)
  const results = resolveResults(requiredObject(candidate, 'results'), secondaryColorValue)
  const cardWidth = requiredString(candidate, 'cardWidth')
  const mediaAspectRatio = requiredString(candidate, 'mediaAspectRatio')
  const infoPosition = requiredString(candidate, 'infoPosition')
  validateCardSettings(cardWidth, mediaAspectRatio, infoPosition)

  const nextProject = reference(caseStudyId(optionalString(fields.nextProject) ?? nextTitle))
  if (nextProject._ref === id) throw new Error(`Next Project cannot self-reference ${id}.`)

  return {
    document: {
      _id: id,
      _type: 'caseStudy',
      title,
      slug: {_type: 'slug', current: slug},
      client: requiredString(candidate, 'client'),
      summary: requiredString(candidate, 'summary'),
      capabilities: references(requiredArray(candidate, 'capabilities'), 'capabilities', 1, 6),
      ...(fields.tags ? {tags: references(requiredArray(candidate, 'tags'), 'tags', 0, 2)} : {}),
      publicationDate: date(requiredString(candidate, 'publicationDate')),
      cardMedia: cardMedia.box,
      cardWidth,
      mediaAspectRatio,
      infoPosition,
      primaryColor,
      ...(secondaryColorValue ? {secondaryColor: color(secondaryColorValue, 'secondaryColor')} : {}),
      ...(leadMedia ? {leadMedia: leadMedia.box} : {}),
      highlights: narrative(candidate, 'highlights'),
      challenge: narrative(candidate, 'challenge'),
      unexpectedInsight: narrative(candidate, 'unexpectedInsight'),
      bigIdea: narrative(candidate, 'bigIdea'),
      results,
      ...(fields.press ? {press: press(requiredArray(candidate, 'press'))} : {}),
      nextProject,
    },
    media: [cardMedia, ...(leadMedia ? [leadMedia] : [])].map(({checksum, field}) => ({
      checksum,
      field,
      provenance: mediaProvenance(candidate.targetId, field, manifest),
    })),
    fieldProvenance: Object.fromEntries(
      Object.entries(fields).map(([path, field]) => [path, field.provenance]),
    ),
    inferredFields: inferredFields(fields),
  }
}

function mediaProvenance(targetId: string, field: string, manifest: StarterManifest): ManifestProvenance {
  const media = manifest.media.find((item) => item.targetId === targetId && item.field === field)
  if (!media) throw new Error(`${targetId}.${field} requires media provenance.`)
  return media.provenance
}

function mediaBox(
  targetId: string,
  field: 'cardMedia' | 'leadMedia',
  manifest: StarterManifest,
  mediaByChecksum: Map<string, RetrievedMedia>,
  required = true,
): {box: MediaBox; checksum: string; field: 'cardMedia' | 'leadMedia'} | undefined {
  const media = manifest.media.find((item) => item.targetId === targetId && item.field === field)
  if (!media) {
    if (required) throw new Error(`${targetId}.${field} requires retrieved project media.`)
    return undefined
  }
  const retrieved = mediaByChecksum.get(media.checksum)
  if (!retrieved) {
    throw new Error(`${targetId}.${field} references media that was not retrieved.`)
  }
  return {
    checksum: media.checksum,
    field,
    box: {
      _type: 'mediaBox',
      asset: [assetForRetrievedMedia(retrieved, field)],
      altText: `${targetId} ${field}`,
    },
  }
}

function assetForRetrievedMedia(media: RetrievedMedia, field: string): MediaAsset {
  if (media.mimeType.startsWith('image/')) {
    return {_type: 'image', _key: `${field}-asset`, asset: reference(`image-${media.checksum}`)}
  }
  if (media.mimeType.startsWith('video/')) {
    return {_type: 'mux.video', _key: `${field}-asset`, asset: reference(`mux.videoAsset-${media.checksum}`)}
  }
  throw new Error(`${field} requires retrieved image or video media.`)
}

function narrative(candidate: StarterCandidate, field: 'highlights' | 'challenge' | 'unexpectedInsight' | 'bigIdea'): NarrativeSection {
  const text = requiredString(candidate, field)
  return {
    _type: 'caseStudyNarrativeSection',
    summary: [{
      _type: 'block',
      _key: `${field}-summary`,
      style: 'normal',
      children: [{_type: 'span', _key: `${field}-span`, text, marks: []}],
      markDefs: [],
    }],
  }
}

function resolveResults(value: Record<string, unknown>, secondaryColor?: string): Results {
  const backgroundColor = value.backgroundColor
  if (backgroundColor !== 'primary' && backgroundColor !== 'secondary') {
    throw new Error('results.backgroundColor must be primary or secondary.')
  }
  if (backgroundColor === 'secondary' && !secondaryColor) {
    throw new Error('secondaryColor is required when Results uses the secondary background.')
  }
  if (!Array.isArray(value.stats) || value.stats.length < 1 || value.stats.length > 4) {
    throw new Error('results.stats requires 1-4 complete stats.')
  }
  return {
    _type: 'caseStudyResults',
    backgroundColor,
    stats: value.stats.map((stat, index) => {
      if (!stat || typeof stat !== 'object' || Array.isArray(stat)) {
        throw new Error('results.stats must contain objects.')
      }
      const record = stat as Record<string, unknown>
      if (typeof record.value !== 'string' || !record.value || typeof record.label !== 'string' || !record.label) {
        throw new Error('results.stats requires a value and label.')
      }
      return {_type: 'caseStudyStat', _key: `result-stat-${index + 1}`, value: record.value, label: record.label}
    }),
  }
}

function press(value: unknown[]): KeyedReference[] {
  if (value.length > 3) throw new Error('Press accepts at most three News references.')
  const refs = value.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Press must contain News references.')
    const record = item as Record<string, unknown>
    if (record.articleType !== 'news' || typeof record._ref !== 'string' || !record._ref) {
      throw new Error('Press references must resolve to News.')
    }
    return keyedReference(record._ref, `press-${index + 1}`)
  })
  if (new Set(refs.map(({_ref}) => _ref)).size !== refs.length) throw new Error('Press references must be unique.')
  return refs
}

function references(value: unknown[], field: string, min: number, max: number): KeyedReference[] {
  if (value.length < min || value.length > max) throw new Error(`${field} requires ${min}-${max} unique references.`)
  const refs = value.map((item, index) =>
    keyedReference(typeof item === 'string' ? item : referenceValue(item, field), `${field}-${index + 1}`),
  )
  if (new Set(refs.map(({_ref}) => _ref)).size !== refs.length) throw new Error(`${field} references must be unique.`)
  return refs
}

function referenceValue(value: unknown, field: string): string {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof (value as {_ref?: unknown})._ref !== 'string') {
    throw new Error(`${field} requires references.`)
  }
  return (value as {_ref: string})._ref
}

function reference(_ref: string): Reference {
  if (!_ref) throw new Error('Reference IDs must not be empty.')
  return {_type: 'reference', _ref}
}

function keyedReference(_ref: string, _key: string): KeyedReference {
  return {...reference(_ref), _key}
}

function caseStudyId(value: string): string {
  return `case-study-${slugify(value.replace(/^(?:drafts\.)?case-study-/, ''))}`
}

function validateCardSettings(cardWidth: string, mediaAspectRatio: string, infoPosition: string) {
  if (!CARD_WIDTHS.has(cardWidth)) throw new Error('cardWidth is invalid.')
  if (!MEDIA_ASPECT_RATIOS.has(mediaAspectRatio)) throw new Error('mediaAspectRatio is invalid.')
  if (!INFO_POSITIONS.has(infoPosition)) throw new Error('infoPosition is invalid.')
  if ((infoPosition === 'left' || infoPosition === 'right') && (cardWidth === '1/4' || cardWidth === '1/3')) {
    throw new Error(`Info position "${infoPosition}" requires card width of 1/2 or greater.`)
  }
}

function color(value: string, field: string): {hex: string} {
  if (!HEX_COLOR.test(value)) throw new Error(`${field} must be a six-digit hex color.`)
  return {hex: value}
}

function date(value: string): string {
  if (Number.isNaN(Date.parse(value))) throw new Error('publicationDate must be an ISO date.')
  return new Date(value).toISOString()
}

function inferredFields(fields: Record<string, ManifestField>) {
  return Object.entries(fields).flatMap(([path, field]) =>
    field.provenance.kind === 'inferred'
      ? [{path, rationale: inferredRationale(field.provenance)}]
      : [],
  )
}

function inferredRationale(provenance: ManifestProvenance) {
  if (!provenance.rationale) throw new Error('Inferred field provenance requires a rationale.')
  return provenance.rationale
}

function requiredString(candidate: StarterCandidate, field: string): string {
  const value = candidate.fields[field]?.value
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${candidate.targetId}.${field} must be non-empty.`)
  return value
}

function optionalString(field: ManifestField | undefined): string | undefined {
  const value = field?.value
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !value.trim()) throw new Error('Optional string fields must be non-empty strings.')
  return value
}

function requiredArray(candidate: StarterCandidate, field: string): unknown[] {
  const value = candidate.fields[field]?.value
  if (!Array.isArray(value)) throw new Error(`${candidate.targetId}.${field} must be an array.`)
  return value
}

function requiredObject(candidate: StarterCandidate, field: string): Record<string, unknown> {
  const value = candidate.fields[field]?.value
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${candidate.targetId}.${field} must be an object.`)
  }
  return value as Record<string, unknown>
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  if (!slug) throw new Error('Case Study slug must not be empty.')
  return slug
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

if (import.meta.main) {
  await resolveCaseStudiesFromFiles()
  console.log(`Wrote resolved Case Studies to ${resolve(generatedDirectory, 'resolved-case-studies.json')}`)
}
