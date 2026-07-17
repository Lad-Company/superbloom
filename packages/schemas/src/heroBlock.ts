import {defineField, defineType} from 'sanity'

export const heroBlock = defineType({
  name: 'heroBlock',
  title: 'Hero',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subheading',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'heroMedia',
      title: 'Background Media',
      type: 'mediaBox',
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare: ({title}) => ({title: title || 'Hero', subtitle: 'Hero'}),
  },
})
