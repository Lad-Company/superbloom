import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {retrieveMedia} from './retrieve-media.ts'
import type {MediaInventoryEntry} from './types'

const seedDirectory = resolve(import.meta.dirname, '..')
const generatedDirectory = resolve(seedDirectory, 'generated')
const cacheDirectory = resolve(seedDirectory, 'cache')
export const sourceUrls = [
  'https://drive.google.com/drive/folders/1eXLRidA2RUIM97abqOkvBnTBlSWmvPtn?usp=sharing',
  'https://next.frame.io/share/b65a33b0-903d-494f-a85f-9036fb046673/',
]

export async function retrieveManifest({
  inventoryPath = resolve(generatedDirectory, 'media-manifest.json'),
  outputPath = resolve(generatedDirectory, 'retrieved-media-manifest.json'),
  diagnosticsPath = resolve(generatedDirectory, 'retrieval-diagnostics.json'),
  sourceUrlsPath = resolve(generatedDirectory, 'media-sources.json'),
  cachePath = cacheDirectory,
}: {
  inventoryPath?: string
  outputPath?: string
  diagnosticsPath?: string
  sourceUrlsPath?: string
  cachePath?: string
} = {}): Promise<void> {
  const media = JSON.parse(await readFile(inventoryPath, 'utf8')) as MediaInventoryEntry[]
  const result = await retrieveMedia({
    media,
    cacheDirectory: cachePath,
    sourceUrls,
  })

  await mkdir(generatedDirectory, {recursive: true})
  await Promise.all([
    writeFile(outputPath, `${JSON.stringify(result.media, null, 2)}\n`),
    writeFile(diagnosticsPath, `${JSON.stringify(result.diagnostics, null, 2)}\n`),
    writeFile(sourceUrlsPath, `${JSON.stringify(sourceUrls, null, 2)}\n`),
  ])
}

if (import.meta.main) {
  await retrieveManifest()
  console.log(`Wrote media retrieval artifacts to ${generatedDirectory}`)
}
