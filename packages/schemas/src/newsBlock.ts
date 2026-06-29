import {defineField, defineType} from 'sanity'

export const newsBlock = defineType({
  name: 'newsBlock',
  title: 'News',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'headline'},
    prepare: ({title}) => ({title: title || 'News', subtitle: 'News (latest)'}),
  },
})
