import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-08-03', perspective: 'raw'})
const backupDirectory = new URL('../backups/', import.meta.url)

async function main() {
  const shopPages = await client.fetch('*[_type == "shopPage"]')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  await mkdir(backupDirectory, {recursive: true})
  const output = join(fileURLToPath(backupDirectory), `shop-featured-cta-${timestamp}.json`)
  await writeFile(output, `${JSON.stringify({shopPages}, null, 2)}\n`)

  console.log(`Backed up ${shopPages.length} Shop Page document(s) to ${output}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
