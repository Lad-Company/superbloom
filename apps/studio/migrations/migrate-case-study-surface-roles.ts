import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-17'})
const roles = {
  primary: 'case-primary',
  secondary: 'case-secondary',
} as const

const caseStudies = await client.fetch<Array<{_id: string; body?: Array<{_key: string; theme?: string}>}>>(
  `*[_type == "caseStudy" && defined(body)]{_id, body[]{_key, theme}}`,
)

const transaction = client.transaction()

for (const caseStudy of caseStudies) {
  for (const block of caseStudy.body ?? []) {
    const role = block.theme && roles[block.theme as keyof typeof roles]
    if (role) {
      transaction.patch(caseStudy._id, (patch) =>
        patch.set({[`body[_key=="${block._key}"].theme`]: role}),
      )
    }
  }
}

await transaction.commit()
