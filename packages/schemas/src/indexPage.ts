import {defineField, defineType} from 'sanity'
import {validateIndexPageSecondary} from './indexPageContract'

export const indexPage = defineType({
  name: 'indexPage',
  title: 'Index Page',
  type: 'document',
  fields: [
    defineField({
      name: 'lead',
      title: 'Lead Item',
      type: 'reference',
      to: [{type: 'article'}],
      options: {filter: 'articleType in ["news", "editorial"]'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'secondary',
      title: 'Secondary Items',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'article'}],
          options: {filter: 'articleType in ["news", "editorial"]'},
        },
      ],
      validation: (rule) => rule.required().custom(validateIndexPageSecondary),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Index Page'}),
  },
})
