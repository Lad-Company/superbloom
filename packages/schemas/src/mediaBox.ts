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
