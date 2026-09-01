import {getCliClient} from 'sanity/cli'

// Moves the retired pointer-follow `introMedia` array into the new page-level
// `parallax` block (same homeParallaxBlock type the homepage uses), seeding
// the block headline from the intro statement so the section keeps its
// on-page copy. Note: introMedia allowed up to 4 items while the parallax
// block validates min(5) — migrated documents with fewer than 5 images will
// flag a validation warning in the Studio until more images are added.

interface MediaBoxEntry {
  _key: string
  _type: string
  [key: string]: unknown
}

const client = getCliClient({apiVersion: '2026-07-17'})

const documents = await client.fetch<
  Array<{
    _id: string
    introStatement?: string
    introMedia?: MediaBoxEntry[]
    parallax?: {headline?: string; images?: MediaBoxEntry[]}
  }>
>(
  `*[_type == "whoWeAre" && defined(introMedia) && count(introMedia) > 0]{_id, introStatement, introMedia, parallax}`,
)

const transaction = client.transaction()

for (const document of documents) {
  transaction.patch(document._id, (patch) =>
    patch
      .set({
        parallax: {
          _type: 'homeParallaxBlock',
          headline: document.parallax?.headline ?? document.introStatement ?? '',
          images: document.parallax?.images?.length
            ? document.parallax.images
            : document.introMedia,
        },
      })
      .unset(['introMedia']),
  )
}

await transaction.commit()
