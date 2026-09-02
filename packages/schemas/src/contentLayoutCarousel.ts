import {defineField, defineType} from 'sanity'
import {validatePortableTextNonEmpty} from './articleContract'

export const CAROUSEL_LAYOUTS = ['full', 'textRight', 'textLeft'] as const
export type CarouselLayout = (typeof CAROUSEL_LAYOUTS)[number]

const isSplitLayout = (layout?: string): layout is 'textRight' | 'textLeft' =>
  layout === 'textRight' || layout === 'textLeft'

const LAYOUT_TITLES: Record<CarouselLayout, string> = {
  full: 'Full width',
  textRight: 'Text right',
  textLeft: 'Text left',
}

/**
 * Carousel Block — three to ten media items (images and/or videos) in one of
 * three layouts:
 *
 * - **Full width** (`full`): the track bleeds edge-to-edge; prev/next controls
 *   sit centered below the carousel.
 * - **Text right** (`textRight`): the carousel takes the left 3/4 of the row
 *   with a descriptive 1/4 text box beside it; controls sit at the carousel's
 *   bottom right. The track overflows only the left edge, past the page
 *   gutter to the viewport edge.
 * - **Text left** (`textLeft`): the mirror image — text box on the left 1/4,
 *   carousel on the right 3/4 with controls at its bottom left, overflowing
 *   only the right edge.
 *
 * Split layouts open on the first item, anchored to the track edge beside
 * the text; upcoming items trail in the direction opposite the text.
 *
 * Every item renders at its intrinsic aspect ratio, height-capped at the
 * 16:9 height so portrait media narrows instead of standing taller. Carousels
 * have no width control: they always span the full row, so a carousel must be
 * the only block in its Content Layout Row (enforced in contentLayoutContract).
 */
export const contentLayoutCarousel = defineType({
  name: 'contentLayoutCarousel',
  title: 'Carousel Block',
  type: 'object',
  fields: [
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: CAROUSEL_LAYOUTS.map((value) => ({title: LAYOUT_TITLES[value], value})),
        layout: 'radio',
      },
      initialValue: 'full',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'array',
      of: [{type: 'mediaBox'}],
      validation: (rule) => rule.required().min(3).max(10),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'array',
      description: 'Descriptive text box shown beside the carousel in the split layouts.',
      of: [
        {
          type: 'block',
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                title: 'Link',
                type: 'object',
                fields: [
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (rule) =>
                      rule.required().uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
                  }),
                ],
              },
            ],
          },
        },
      ],
      hidden: ({parent}) => !isSplitLayout((parent as {layout?: string} | undefined)?.layout),
      validation: (rule) =>
        rule.custom((text, context) => {
          const parent = context.parent as {layout?: string} | undefined
          if (!isSplitLayout(parent?.layout)) return true
          return validatePortableTextNonEmpty(text)
        }),
    }),
  ],
  preview: {
    select: {media: 'media', layout: 'layout'},
    prepare: ({media, layout}: {media?: unknown[]; layout?: CarouselLayout}) => ({
      title: 'Carousel',
      subtitle: `${Array.isArray(media) ? media.length : 0} item(s) · ${LAYOUT_TITLES[layout ?? 'full']}`,
    }),
  },
})
