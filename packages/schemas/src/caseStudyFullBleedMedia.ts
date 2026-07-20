import {defineField, defineType} from 'sanity'

export const caseStudyFullBleedMedia = defineType({
  name: 'caseStudyFullBleedMedia',
  title: 'Full Bleed Media',
  type: 'object',
  fields: [
    defineField({
      name: 'mediaBox',
      title: 'Media',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {asset: 'mediaBox.asset.0._type', altText: 'mediaBox.altText'},
    prepare: ({asset, altText}) => ({
      title: altText || '(no alt text)',
      subtitle: (asset === 'mux.video' ? 'Video' : 'Image') + ' · Full Bleed 16:9',
    }),
  },
})
