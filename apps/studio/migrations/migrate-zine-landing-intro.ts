import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-24'})

const introDefaults = {
  heading:
    'Original stories, interviews, and visual essays from the creative collective on what helps ideas grow.',
  ctaLabel: 'Explore the issue',
}

async function main() {
  const landings = await client.fetch<Array<{_id: string; intro?: unknown}>>(
    '*[_type == "zineLanding"]{_id,intro}',
  )

  const missingIntro = landings.filter((landing) => !landing.intro)
  if (missingIntro.length === 0) {
    console.log('No Zine Landing intro content required migration.')
    return
  }

  const transaction = missingIntro.reduce(
    (current, landing) => current.patch(landing._id, {set: {intro: introDefaults}}),
    client.transaction(),
  )

  await transaction.commit()
  console.log(`Initialized Zine Landing intro content for ${missingIntro.length} document(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
