import {createHash} from 'node:crypto'
import {access, mkdir, readFile, rename, writeFile} from 'node:fs/promises'
import {homedir} from 'node:os'
import {dirname, resolve} from 'node:path'
import type {SourceMetadata} from './types'

const seedDirectory = resolve(import.meta.dirname, '..')
const destinationPath = resolve(seedDirectory, 'source/content-master.md')
const metadataPath = resolve(seedDirectory, 'source/source-metadata.json')
const defaultSourcePath = resolve(homedir(), 'Downloads/SUPERBLOOM WEBSITE CONTENT MASTER TRACKER.md')

export async function refreshSource({
  sourcePath = defaultSourcePath,
  sourceUrl,
  refreshedAt = new Date().toISOString(),
  outputPath = destinationPath,
  outputMetadataPath = metadataPath,
}: {
  sourcePath?: string
  sourceUrl: string
  refreshedAt?: string
  outputPath?: string
  outputMetadataPath?: string
}): Promise<SourceMetadata> {
  validateSourceUrl(sourceUrl)
  await access(sourcePath)
  const contents = await readFile(sourcePath, 'utf8')
  validateMarkdown(contents, sourcePath)

  const metadata: SourceMetadata = {
    checksum: checksum(contents),
    refreshedAt,
    sourceUrl,
  }
  const temporarySnapshotPath = `${outputPath}.${process.pid}.tmp`
  const temporaryMetadataPath = `${outputMetadataPath}.${process.pid}.tmp`

  await mkdir(dirname(outputPath), {recursive: true})
  await mkdir(dirname(outputMetadataPath), {recursive: true})
  await writeFile(temporarySnapshotPath, contents)
  await writeFile(temporaryMetadataPath, `${JSON.stringify(metadata, null, 2)}\n`)
  await rename(temporarySnapshotPath, outputPath)
  await rename(temporaryMetadataPath, outputMetadataPath)

  return metadata
}

export function validateMarkdown(contents: string, sourcePath: string): void {
  if (!contents.trim()) throw new Error(`Source snapshot is empty: ${sourcePath}`)
  if (!/^#{1,6}\s+\S/m.test(contents)) {
    throw new Error(`Source snapshot does not contain a Markdown heading: ${sourcePath}`)
  }
}

export function checksum(contents: string): string {
  return createHash('sha256').update(contents).digest('hex')
}

function validateSourceUrl(value: string): void {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
  } catch {
    throw new Error(`Source URL must be an http(s) URL: ${value}`)
  }
}

if (import.meta.main) {
  const sourcePath = argumentValue('--source')
  const sourceUrl = argumentValue('--source-url')
  if (!sourceUrl) {
    throw new Error('Provide the tracker URL with --source-url <https://...>.')
  }

  const metadata = await refreshSource({sourcePath, sourceUrl})
  console.log(`Refreshed source snapshot (${metadata.checksum})`)
}

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}
