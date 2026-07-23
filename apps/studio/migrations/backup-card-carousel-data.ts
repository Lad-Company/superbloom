import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-23'})
const backupDirectory = new URL('../backups/', import.meta.url)

async function main() {
  const data = await client.fetch(`{
    "homepage": *[_id == "homepage"][0]{_id, news},
    "articles": *[_type == "article" && count(relatedItems) > 0]{_id, relatedItems}
  }`)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  await mkdir(backupDirectory, {recursive: true})
  const output = join(fileURLToPath(backupDirectory), `card-carousel-${timestamp}.json`)
  await writeFile(output, `${JSON.stringify(data, null, 2)}\n`)

  console.log(`Backed up card carousel data to ${output}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
