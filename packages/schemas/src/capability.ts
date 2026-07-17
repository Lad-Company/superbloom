import {defineField, defineType} from 'sanity'

export const capability = defineType({
  name: 'capability',
  title: 'Capability',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'mediaBox',
    }),
  ],
})
