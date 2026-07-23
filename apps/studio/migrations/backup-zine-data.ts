import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-06-01'})
const backupDirectory = new URL('../backups/', import.meta.url)

async function main() {
  const documents = await client.fetch(
    '*[_type == "zineIssue" || (_type == "article" && articleType == "zine")]',
  )
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  await mkdir(backupDirectory, {recursive: true})
  const output = join(backupDirectory.pathname, `zine-${timestamp}.json`)
  await writeFile(output, `${JSON.stringify(documents, null, 2)}\n`)

  console.log(`Backed up ${documents.length} Zine document(s) to ${output}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
