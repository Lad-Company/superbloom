import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-22'})
const backupDirectory = new URL('../backups/', import.meta.url)

async function main() {
  const [workIndex, caseStudies] = await Promise.all([
    client.fetch('*[_id == "workIndex"][0]'),
    client.fetch('*[_type == "caseStudy"] | order(orderRank asc)'),
  ])
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  await mkdir(backupDirectory, {recursive: true})
  const output = join(fileURLToPath(backupDirectory), `work-index-${timestamp}.json`)
  await writeFile(output, `${JSON.stringify({workIndex, caseStudies}, null, 2)}\n`)

  console.log(`Backed up Work Index singleton and ${caseStudies.length} Case Studies to ${output}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
