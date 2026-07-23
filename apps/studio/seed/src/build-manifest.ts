import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {extractTracker} from './extract-tracker.ts'
import {checksum} from './refresh-source.ts'
import type {SourceMetadata} from './types'

const seedDirectory = resolve(import.meta.dirname, '..')
const sourcePath = resolve(seedDirectory, 'source/content-master.md')
const metadataPath = resolve(seedDirectory, 'source/source-metadata.json')
const generatedDirectory = resolve(seedDirectory, 'generated')

export async function buildManifest(): Promise<void> {
  const [markdown, metadataContents] = await Promise.all([
    readFile(sourcePath, 'utf8'),
    readFile(metadataPath, 'utf8'),
  ])
  const metadata = parseSourceMetadata(metadataContents)
  if (metadata.checksum !== checksum(markdown)) {
    throw new Error('Source snapshot checksum does not match source metadata. Run seed:refresh-source again.')
  }
  const extraction = extractTracker(markdown)

  await mkdir(generatedDirectory, {recursive: true})
  await Promise.all([
    writeJson('source-manifest.json', {path: sourcePath, ...metadata}),
    writeJson('source-outline.json', extraction.outline),
    writeJson('link-inventory.json', extraction.links),
    writeJson('media-manifest.json', extraction.media),
    writeJson('diagnostics.json', extraction.diagnostics),
  ])
}

function parseSourceMetadata(value: string): SourceMetadata {
  const metadata = JSON.parse(value) as Partial<SourceMetadata>
  if (
    typeof metadata.checksum !== 'string' ||
    typeof metadata.refreshedAt !== 'string' ||
    typeof metadata.sourceUrl !== 'string'
  ) {
    throw new Error('Source metadata is invalid. Run seed:refresh-source again.')
  }
  return metadata as SourceMetadata
}

async function writeJson(filename: string, value: unknown): Promise<void> {
  await writeFile(resolve(generatedDirectory, filename), `${JSON.stringify(value, null, 2)}\n`)
}

if (import.meta.main) {
  await buildManifest()
  console.log(`Wrote source extraction artifacts to ${generatedDirectory}`)
}
