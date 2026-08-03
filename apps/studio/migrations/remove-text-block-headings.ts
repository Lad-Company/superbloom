import {getCliClient} from 'sanity/cli'

// `perspective: 'raw'` so drafts carrying the legacy field are cleaned too.
const client = getCliClient({apiVersion: '2026-08-03', perspective: 'raw'})

type TextBlock = {_type?: string; _key?: string; heading?: string | null}
type LayoutRow = {_key?: string; blocks?: TextBlock[] | null}
type NarrativeSection = {mediaLayouts?: LayoutRow[] | null} | null | undefined

const NARRATIVE_SECTIONS = ['highlights', 'challenge', 'unexpectedInsight', 'bigIdea'] as const

/** Paths to every stored `heading` on a Text Block within the given rows. */
const headingPaths = (rows: LayoutRow[] | null | undefined, prefix: string) =>
  (rows ?? []).flatMap((row) =>
    (row.blocks ?? [])
      .filter(
        (block) =>
          block._type === 'contentLayoutText' && block.heading != null && row._key && block._key,
      )
      .map((block) => `${prefix}[_key=="${row._key}"].blocks[_key=="${block._key}"].heading`),
  )

const rowProjection = `{_key, blocks[]{_key, _type, heading}}`

async function main() {
  const [caseStudies, articles] = await Promise.all([
    client.fetch<
      Array<{
        _id: string
        highlights?: NarrativeSection
        challenge?: NarrativeSection
        unexpectedInsight?: NarrativeSection
        bigIdea?: NarrativeSection
        results?: {supportingRows?: LayoutRow[] | null} | null
      }>
    >(
      `*[_type == "caseStudy"]{
        _id,
        ${NARRATIVE_SECTIONS.map((name) => `${name}{mediaLayouts[]${rowProjection}}`).join(',\n')}
        ,
        results{supportingRows[]${rowProjection}}
      }`,
    ),
    client.fetch<Array<{_id: string; body?: LayoutRow[] | null}>>(
      '*[_type == "article"]{_id, body[]' + rowProjection + '}',
    ),
  ])

  const patches: Array<{_id: string; paths: string[]}> = []

  for (const document of caseStudies) {
    const paths = NARRATIVE_SECTIONS.flatMap((name) =>
      headingPaths(document[name]?.mediaLayouts, `${name}.mediaLayouts`),
    )
    paths.push(...headingPaths(document.results?.supportingRows, 'results.supportingRows'))
    if (paths.length > 0) patches.push({_id: document._id, paths})
  }

  for (const document of articles) {
    const paths = headingPaths(document.body, 'body')
    if (paths.length > 0) patches.push({_id: document._id, paths})
  }

  if (patches.length === 0) {
    console.log('No Text Block headings found — nothing to remove.')
    return
  }

  for (const {_id, paths} of patches) {
    console.log(`Unsetting ${paths.length} heading(s) on ${_id}:`)
    for (const path of paths) console.log(`  - ${path}`)
  }

  const transaction = client.transaction()
  for (const {_id, paths} of patches) {
    transaction.patch(_id, (patch) => patch.unset(paths))
  }
  await transaction.commit()

  console.log(
    `Removed Text Block headings from ${patches.length} document(s) ` +
      `(${patches.reduce((total, patch) => total + patch.paths.length, 0)} field(s) total).`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
