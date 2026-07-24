import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-06-01'})

async function main() {
  const caseStudies = await client.fetch<{_id: string}[]>(
    '*[_type == "caseStudy" && defined(orderRank)]{_id}',
  )

  if (caseStudies.length === 0) {
    console.log('No Case Studies have a legacy orderRank field.')
    return
  }

  let transaction = client.transaction()
  for (const {_id} of caseStudies) {
    transaction = transaction.patch(_id, {unset: ['orderRank']})
  }

  await transaction.commit()

  console.log(`Removed legacy orderRank from ${caseStudies.length} Case Study document(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
