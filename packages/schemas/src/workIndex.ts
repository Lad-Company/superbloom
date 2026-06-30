import {defineField, defineType} from 'sanity'

export const workIndex = defineType({
  name: 'workIndex',
  title: 'Work Index',
  type: 'document',
  fields: [
    defineField({
      name: 'heroHeading',
      title: 'Hero Heading',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'allWorkHeading',
      title: 'All Work Heading',
      type: 'string',
      initialValue: 'All work',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Work Index'}),
  },
})
