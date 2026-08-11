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
      name: 'contextualCopy',
      title: 'Contextual Copy',
      description: 'Shown in the sticky left panel. One global copy for the whole section.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'capabilities',
      title: 'Capabilities',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'capability'}]}],
      validation: (rule) => rule.min(1).max(8),
    }),
  ],
  preview: {
    select: {title: 'headline'},
    prepare: ({title}) => ({title: title || 'Capabilities', subtitle: 'Capabilities'}),
  },
})
