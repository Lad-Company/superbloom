import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-08-03', perspective: 'raw'})
const backupDirectory = new URL('../backups/', import.meta.url)

async function main() {
  const [caseStudies, articles] = await Promise.all([
    client.fetch('*[_type == "caseStudy"]'),
    client.fetch('*[_type == "article"]'),
  ])
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  await mkdir(backupDirectory, {recursive: true})
  const output = join(fileURLToPath(backupDirectory), `text-block-headings-${timestamp}.json`)
  await writeFile(output, `${JSON.stringify({caseStudies, articles}, null, 2)}\n`)

  console.log(
    `Backed up ${caseStudies.length} Case Studies and ${articles.length} Articles to ${output}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
