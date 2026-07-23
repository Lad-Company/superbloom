import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-06-01'})
const backupDirectory = new URL('../backups/', import.meta.url)

async function main() {
  const document = await client.fetch('*[_id == "indexPage"][0]')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  await mkdir(backupDirectory, {recursive: true})
  const output = join(fileURLToPath(backupDirectory), `index-page-${timestamp}.json`)
  await writeFile(output, `${JSON.stringify(document ?? null, null, 2)}\n`)

  console.log(`Backed up Index Page singleton to ${output}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
