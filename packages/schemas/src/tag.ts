import {defineField, defineType} from 'sanity'

export const tag = defineType({
  name: 'tag',
  title: 'Tag',
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
    defineField({name: 'description', type: 'text', rows: 2}),
    defineField({
      name: 'color',
      type: 'string',
      title: 'Color (hex)',
      description: 'e.g. #99a224',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'description'},
  },
})
