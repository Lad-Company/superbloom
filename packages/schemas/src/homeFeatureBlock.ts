import {defineField, defineType} from 'sanity'

export const homeFeatureBlock = defineType({
  name: 'homeFeatureBlock',
  title: 'Feature',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'mediaBox',
    }),
  ],
  preview: {
    select: {title: 'headline'},
    prepare: ({title}) => ({title: title || 'Feature', subtitle: 'Feature block'}),
  },
})
