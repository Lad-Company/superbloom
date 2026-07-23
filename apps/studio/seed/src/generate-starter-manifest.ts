import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {relative, resolve} from 'node:path'
import type {
  GenerationDiagnostic,
  GenerationDiagnostics,
  ManifestField,
  ManifestProvenance,
  RetrievedMedia,
  SourceRef,
  StarterCandidate,
  StarterCoverage,
  StarterManifest,
  StarterManifestInputs,
  StarterMediaUse,
  StarterTarget,
} from './types'

const seedDirectory = resolve(import.meta.dirname, '..')
const sourceDirectory = resolve(seedDirectory, 'source')
const generatedDirectory = resolve(seedDirectory, 'generated')
const validDocumentTypes = new Set<StarterTarget['documentType']>([
  'homepage',
  'workIndex',
  'whoWeAre',
  'indexPage',
  'article',
  'caseStudy',
  'zineIssue',
])

export type StarterGenerator = (input: {
  source: string
  sourceChecksum: string
  inputs: StarterManifestInputs
  coverage: StarterCoverage
  media: RetrievedMedia[]
}) => Promise<unknown>

export async function generateStarterManifest({
  generator = configuredGenerator(),
  sourcePath = resolve(sourceDirectory, 'content-master.md'),
  sourceManifestPath = resolve(generatedDirectory, 'source-manifest.json'),
  retrievedMediaPath = resolve(generatedDirectory, 'retrieved-media-manifest.json'),
  mediaSourcesPath = resolve(generatedDirectory, 'media-sources.json'),
  coveragePath = resolve(seedDirectory, 'starter-coverage.json'),
  outputPath = resolve(generatedDirectory, 'starter-manifest.json'),
  diagnosticsPath = resolve(generatedDirectory, 'generation-diagnostics.json'),
}: {
  generator?: StarterGenerator
  sourcePath?: string
  sourceManifestPath?: string
  retrievedMediaPath?: string
  mediaSourcesPath?: string
  coveragePath?: string
  outputPath?: string
  diagnosticsPath?: string
} = {}): Promise<StarterManifest> {
  const [source, sourceManifest, retrievedMedia, mediaSources, coverage] = await Promise.all([
    readFile(sourcePath, 'utf8'),
    readJson(sourceManifestPath),
    readJson(retrievedMediaPath),
    readJson(mediaSourcesPath),
    readJson(coveragePath),
  ])
  const inputs = parseInputs(sourceManifest, mediaSources, relative(seedDirectory, sourcePath))
  const sourceChecksum = inputs.googleDoc.checksum
  const parsedMedia = parseRetrievedMedia(retrievedMedia)
  const parsedCoverage = parseCoverage(coverage)

  try {
    const output = await generator({
      source,
      sourceChecksum,
      inputs,
      coverage: parsedCoverage,
      media: parsedMedia,
    })
    const manifest = validateStarterManifest(output, {
      coverage: parsedCoverage,
      sourceChecksum,
      mediaChecksums: new Set(parsedMedia.map((media) => media.checksum)),
      inputs,
    })

    await mkdir(generatedDirectory, {recursive: true})
    await Promise.all([
      writeJson(outputPath, manifest),
      writeJson(diagnosticsPath, {
        generatedAt: manifest.generatedAt,
        sourceChecksum,
        diagnostics: [],
      } satisfies GenerationDiagnostics),
    ])
    return manifest
  } catch (error) {
    const diagnostic: GenerationDiagnostic = {
      level: 'error',
      code: error instanceof ManifestValidationError ? 'invalid-llm-output' : 'generation-failed',
      message: error instanceof Error ? error.message : 'Starter manifest generation failed.',
      generatedAt: new Date().toISOString(),
      sourceChecksum,
    }
    await mkdir(generatedDirectory, {recursive: true})
    await writeJson(diagnosticsPath, {
      generatedAt: diagnostic.generatedAt,
      sourceChecksum,
      diagnostics: [diagnostic],
    } satisfies GenerationDiagnostics)
    throw error
  }
}

export function configuredGenerator(environment = process.env): StarterGenerator {
  const endpoint = environment.SEED_LLM_ENDPOINT
  if (!endpoint) {
    return async () => {
      throw new Error('SEED_LLM_ENDPOINT must be configured to generate a starter manifest.')
    }
  }

  return async (input) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(environment.SEED_LLM_API_KEY
          ? {authorization: `Bearer ${environment.SEED_LLM_API_KEY}`}
          : {}),
      },
      body: JSON.stringify({
        model: environment.SEED_LLM_MODEL,
        instruction:
          'Return only a starter manifest JSON object. Populate complete candidate content for every configured target. For the six Case Studies (Tyson, Silversea, Deel, Simon Malls, Voodoo Ranger, Jimmy Dean), include title, client, summary, capabilities, optional tags, publicationDate, cardWidth, mediaAspectRatio, infoPosition, primaryColor, optional secondaryColor, highlights, challenge, unexpectedInsight, bigIdea, results, optional press, and optional nextProject. Use a retrieved-media checksum for every cardMedia and leadMedia use. Every inferred value needs provenance with a rationale. Press values must identify articleType "news", and nextProject must not be the candidate itself.',
        input,
      }),
    })
    if (!response.ok) throw new Error(`Configured LLM returned HTTP ${response.status}.`)
    const output = (await response.json()) as {manifest?: unknown}
    return output.manifest ?? output
  }
}

export function validateStarterManifest(
  value: unknown,
  {
    coverage,
    sourceChecksum,
    mediaChecksums,
    inputs,
  }: {
    coverage: StarterCoverage
    sourceChecksum: string
    mediaChecksums: Set<string>
    inputs: StarterManifestInputs
  },
): StarterManifest {
  const manifest = object(value, 'LLM output must be an object.')
  if (manifest.schemaVersion !== 1) throw invalid('schemaVersion must be 1.')
  if (!isIsoDate(manifest.generatedAt)) throw invalid('generatedAt must be an ISO timestamp.')
  if (manifest.sourceChecksum !== sourceChecksum) throw invalid('sourceChecksum does not match the source manifest.')
  if (JSON.stringify(manifest.inputs) !== JSON.stringify(inputs)) {
    throw invalid('inputs must exactly match the configured source inputs.')
  }
  const manifestCoverage = parseCoverage(manifest.coverage)
  if (JSON.stringify(manifestCoverage) !== JSON.stringify(coverage)) {
    throw invalid('coverage must exactly match the configured starter coverage.')
  }

  const candidates = array(manifest.candidates, 'candidates must be an array.').map(parseCandidate)
  const byTarget = new Map(candidates.map((candidate) => [candidate.targetId, candidate]))
  if (byTarget.size !== candidates.length) throw invalid('candidates must not repeat a targetId.')
  if (byTarget.size !== coverage.targets.length) throw invalid('candidates must cover every configured target.')
  for (const target of coverage.targets) {
    const candidate = byTarget.get(target.id)
    if (!candidate || candidate.documentType !== target.documentType) {
      throw invalid(`candidate for ${target.id} must match its configured document type.`)
    }
  }

  const media = array(manifest.media, 'media must be an array.').map(parseMediaUse)
  for (const item of media) {
    if (!mediaChecksums.has(item.checksum)) {
      throw invalid(`media checksum ${item.checksum} was not retrieved.`)
    }
    if (!byTarget.has(item.targetId)) throw invalid(`media target ${item.targetId} is not a candidate.`)
  }

  return {
    schemaVersion: 1,
    generatedAt: manifest.generatedAt,
    sourceChecksum,
    inputs,
    coverage,
    candidates,
    media,
  }
}

export function requireSourceChecksumApproval(
  manifest: Pick<StarterManifest, 'sourceChecksum'>,
  approvedSourceChecksum: string | undefined,
): void {
  if (!approvedSourceChecksum || approvedSourceChecksum !== manifest.sourceChecksum) {
    throw new Error('Production mutation requires --approve-source-checksum matching the reviewed manifest.')
  }
}

function parseCandidate(value: unknown): StarterCandidate {
  const candidate = object(value, 'Each candidate must be an object.')
  if (typeof candidate.targetId !== 'string' || !candidate.targetId) throw invalid('candidate.targetId is required.')
  if (!validDocumentTypes.has(candidate.documentType as StarterTarget['documentType'])) {
    throw invalid('candidate.documentType is invalid.')
  }
  const fields = object(candidate.fields, 'candidate.fields must be an object.')
  if (Object.keys(fields).length === 0) throw invalid('candidate.fields must not be empty.')
  return {
    targetId: candidate.targetId,
    documentType: candidate.documentType as StarterTarget['documentType'],
    fields: Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, parseField(field)])),
  }
}

function parseField(value: unknown): ManifestField {
  const field = object(value, 'Each candidate field must be an object.')
  if (!Object.hasOwn(field, 'value') || field.value === undefined) throw invalid('Each candidate field needs a value.')
  return {value: field.value, provenance: parseProvenance(field.provenance)}
}

function parseMediaUse(value: unknown): StarterMediaUse {
  const media = object(value, 'Each media use must be an object.')
  if (typeof media.checksum !== 'string' || !media.checksum) throw invalid('media.checksum is required.')
  if (typeof media.targetId !== 'string' || !media.targetId) throw invalid('media.targetId is required.')
  if (typeof media.field !== 'string' || !media.field) throw invalid('media.field is required.')
  return {
    checksum: media.checksum,
    targetId: media.targetId,
    field: media.field,
    provenance: parseProvenance(media.provenance),
  }
}

function parseProvenance(value: unknown): ManifestProvenance {
  const provenance = object(value, 'Each field requires provenance.')
  if (!['source', 'derived', 'inferred'].includes(provenance.kind as string)) {
    throw invalid('provenance.kind must be source, derived, or inferred.')
  }
  const sources = array(provenance.sources, 'provenance.sources must be an array.').map(parseSourceRef)
  if (sources.length === 0) throw invalid('provenance.sources must not be empty.')
  if (provenance.kind === 'inferred' && (typeof provenance.rationale !== 'string' || !provenance.rationale)) {
    throw invalid('inferred provenance requires a rationale.')
  }
  return {
    kind: provenance.kind as ManifestProvenance['kind'],
    sources,
    ...(typeof provenance.rationale === 'string' ? {rationale: provenance.rationale} : {}),
  }
}

function parseSourceRef(value: unknown): SourceRef {
  const source = object(value, 'Each provenance source must be an object.')
  if (
    !Number.isInteger(source.lineStart) ||
    !Number.isInteger(source.lineEnd) ||
    !Array.isArray(source.headingPath) ||
    !source.headingPath.every((heading) => typeof heading === 'string') ||
    typeof source.text !== 'string'
  ) {
    throw invalid('provenance source is malformed.')
  }
  return {
    lineStart: source.lineStart as number,
    lineEnd: source.lineEnd as number,
    headingPath: source.headingPath as string[],
    text: source.text,
    ...(typeof source.url === 'string' ? {url: source.url} : {}),
  }
}

function parseCoverage(value: unknown): StarterCoverage {
  const coverage = object(value, 'starter coverage must be an object.')
  const targets = array(coverage.targets, 'starter coverage targets must be an array.').map((value) => {
    const target = object(value, 'starter target must be an object.')
    if (
      typeof target.id !== 'string' ||
      !target.id ||
      !validDocumentTypes.has(target.documentType as StarterTarget['documentType']) ||
      typeof target.figmaUrl !== 'string' ||
      !target.figmaUrl
    ) {
      throw new Error('starter coverage target is invalid.')
    }
    return target as StarterTarget
  })
  if (targets.length === 0 || new Set(targets.map((target) => target.id)).size !== targets.length) {
    throw new Error('starter coverage must have uniquely identified targets.')
  }
  return {targets}
}

function parseInputs(
  sourceManifestValue: unknown,
  mediaSourcesValue: unknown,
  trackerExportPath: string,
): StarterManifestInputs {
  const sourceManifest = object(sourceManifestValue, 'source manifest must be an object.')
  if (
    typeof sourceManifest.checksum !== 'string' ||
    !sourceManifest.checksum ||
    typeof sourceManifest.sourceUrl !== 'string' ||
    !sourceManifest.sourceUrl
  ) {
    throw new Error('source manifest must include a Google Docs export URL and checksum.')
  }
  const mediaSources = array(mediaSourcesValue, 'media sources must be an array.')
  if (!mediaSources.every((url) => typeof url === 'string' && url)) {
    throw new Error('media sources must contain non-empty URLs.')
  }
  const urls = mediaSources as string[]
  const frameIo = urls.find((url) => new URL(url).hostname.endsWith('frame.io'))
  if (!frameIo) throw new Error('media sources must include a Frame.io URL.')
  const googleDrive = urls.find((url) => new URL(url).hostname.endsWith('drive.google.com'))
  return {
    googleDoc: {
      url: sourceManifest.sourceUrl,
      checksum: sourceManifest.checksum,
    },
    trackerExport: {
      path: trackerExportPath,
      checksum: sourceManifest.checksum,
    },
    frameIo,
    ...(googleDrive ? {googleDrive} : {}),
  }
}

function parseRetrievedMedia(value: unknown): RetrievedMedia[] {
  return array(value, 'retrieved media manifest must be an array.') as RetrievedMedia[]
}

function object(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(message)
  return value as Record<string, unknown>
}

function array(value: unknown, message: string): unknown[] {
  if (!Array.isArray(value)) throw invalid(message)
  return value
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function invalid(message: string): ManifestValidationError {
  return new ManifestValidationError(`Invalid starter manifest: ${message}`)
}

class ManifestValidationError extends Error {}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

if (import.meta.main) {
  await generateStarterManifest()
  console.log(`Wrote starter manifest to ${resolve(generatedDirectory, 'starter-manifest.json')}`)
}
