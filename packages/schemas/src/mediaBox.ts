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
      of: [{type: 'mux.video'}, {type: 'image'}],
      validation: (rule) => rule.required().length(1),
    }),
    defineField({
      name: 'altText',
      title: 'Alt Text',
      type: 'string',
      description: 'Descriptive text for screen readers and when media fails to load.',
      validation: (rule) =>
        rule.custom((altText, context) => {
          const asset = (context.parent?.asset as Array<{_type: string}> | undefined)?.[0]
          if (asset?._type === 'image' && !context.parent?.decorative && !altText) {
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
    prepare: ({asset, altText}) => ({
      title: altText || '(no alt text)',
      subtitle: asset === 'mux.video' ? 'Video' : 'Image',
    }),
  },
})
