import {defineField, defineType} from 'sanity'

export const zineLanding = defineType({
  name: 'zineLanding',
  title: 'Zine Landing',
  type: 'document',
  fields: [
    defineField({
      name: 'currentIssue',
      title: 'Current Issue',
      type: 'reference',
      to: [{type: 'zineIssue'}],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Zine Landing'}),
  },
})
