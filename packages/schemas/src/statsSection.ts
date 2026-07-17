import {defineField, defineType} from 'sanity'

export const statsSection = defineType({
  name: 'statsSection',
  title: 'Stats (Outcomes)',
  type: 'object',
  fields: [
    defineField({
      name: 'theme',
      type: 'string',
      options: {list: ['light', 'dark', 'case-primary', 'case-secondary'], layout: 'radio'},
      initialValue: 'light',
    }),
    defineField({name: 'eyebrow', type: 'string'}),
    defineField({
      name: 'stats',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'stat',
          fields: [
            defineField({name: 'value', type: 'string'}),
            defineField({name: 'label', type: 'string'}),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {title: 'eyebrow'},
    prepare: ({title}) => ({title: title || 'Stats', subtitle: 'Stats Section'}),
  },
})
