import {defineField, defineType} from 'sanity'

export const capesBlock = defineType({
  name: 'capesBlock',
  title: 'Capabilities',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      type: 'string',
    }),
    defineField({
      name: 'capabilities',
      title: 'Capabilities',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'capability'}]}],
      validation: (rule) => rule.min(1).max(6),
    }),
  ],
  preview: {
    select: {title: 'headline'},
    prepare: ({title}) => ({title: title || 'Capabilities', subtitle: 'Capabilities'}),
  },
})
