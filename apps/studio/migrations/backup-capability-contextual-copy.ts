import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-08-03', perspective: 'raw'})
const backupDirectory = new URL('../backups/', import.meta.url)

async function main() {
  const capabilities = await client.fetch(
    '*[_type == "capability" && (defined(contextualCopy) || defined(subtitle))]',
  )
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  await mkdir(backupDirectory, {recursive: true})
  const output = join(
    fileURLToPath(backupDirectory),
    `capability-contextual-copy-${timestamp}.json`,
  )
  await writeFile(output, `${JSON.stringify({capabilities}, null, 2)}\n`)

  console.log(`Backed up ${capabilities.length} Capability document(s) to ${output}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
