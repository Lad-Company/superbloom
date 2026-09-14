import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-22'}).withConfig({perspective: 'raw'})
const backupDirectory = new URL('../backups/', import.meta.url)

async function main() {
  const documents = await client.fetch(
    '*[_type == "article" && articleType == "news" && defined(source)]',
  )
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  await mkdir(backupDirectory, {recursive: true})
  const output = join(fileURLToPath(backupDirectory), `article-cta-labels-${timestamp}.json`)
  await writeFile(output, `${JSON.stringify(documents, null, 2)}\n`)

  console.log(`Backed up ${documents.length} News article(s) with a source value to ${output}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
