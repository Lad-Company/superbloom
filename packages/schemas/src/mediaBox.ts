import {defineField, defineType} from 'sanity'

export const mediaBox = defineType({
  name: 'mediaBox',
  title: 'Media',
  type: 'object',
  fields: [
    defineField({
      name: 'asset',
      title: 'Asset',
      type: 'array',
      of: [
        {type: 'mux.video'},
        {
          type: 'image',
          description:
            'Place the pin on the part of the image that must stay visible when it is cropped into different aspect ratios across the site.',
          options: {
            hotspot: {
              previews: [
                {title: 'Portrait 9:16', aspectRatio: 9 / 16},
                {title: 'Square 1:1', aspectRatio: 1},
                {title: 'Wide 2:1', aspectRatio: 2 / 1},
              ],
            },
          },
        },
      ],
      validation: (rule) => rule.required().length(1),
    }),
    defineField({
      name: 'poster',
      title: 'Poster Image',
      type: 'image',
      description:
        'Optional still shown over the video until a visitor hovers or taps the card, where it slides away to reveal the video. Leave empty to autoplay the video whenever the card is on screen.',
      hidden: ({parent}) =>
        (parent as {asset?: Array<{_type: string}>} | undefined)?.asset?.[0]?._type !==
        'mux.video',
      options: {
        hotspot: {
          previews: [
            {title: 'Portrait 9:16', aspectRatio: 9 / 16},
            {title: 'Square 1:1', aspectRatio: 1},
            {title: 'Wide 2:1', aspectRatio: 2 / 1},
          ],
        },
      },
      validation: (rule) =>
        rule.custom((poster, context) => {
          const parent = context.parent as {asset?: Array<{_type: string}>} | undefined
          if (poster && parent?.asset?.[0]?._type === 'image') {
            return 'A Poster Image can only be set on a video asset'
          }
          return true
        }),
    }),
    defineField({
      name: 'altText',
      title: 'Alt Text',
      type: 'string',
      description: 'Descriptive text for screen readers and when media fails to load.',
      validation: (rule) =>
        rule.custom((altText, context) => {
          const parent = context.parent as
            | {asset?: Array<{_type: string}>; decorative?: boolean}
            | undefined
          const asset = parent?.asset?.[0]
          if (asset?._type === 'image' && !parent?.decorative && !altText) {
            return 'Alt text is required for images unless marked as decorative'
          }
          return true
        }),
    }),
    defineField({
      name: 'decorative',
      title: 'Decorative',
      type: 'boolean',
      initialValue: false,
      description: 'Mark as decorative if this image is purely visual and not informational.',
    }),
  ],
  preview: {
    select: {
      asset: 'asset.0._type',
      altText: 'altText',
    },
    prepare: ({asset, altText}: {asset?: string; altText?: string}) => ({
      title: altText || '(no alt text)',
      subtitle: asset === 'mux.video' ? 'Video' : 'Image',
    }),
  },
})
