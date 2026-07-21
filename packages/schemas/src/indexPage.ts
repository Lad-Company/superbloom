import {defineField, defineType} from 'sanity'
import {validateIndexPageSecondary} from './indexPageContract'

const featuredItemTypes = [{type: 'news'}, {type: 'editorialArticle'}]

export const indexPage = defineType({
  name: 'indexPage',
  title: 'Index Page',
  type: 'document',
  fields: [
    defineField({
      name: 'lead',
      title: 'Lead Item',
      type: 'reference',
      to: featuredItemTypes,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'secondary',
      title: 'Secondary Items',
      type: 'array',
      of: [{type: 'reference', to: featuredItemTypes}],
      validation: (rule) => rule.required().custom(validateIndexPageSecondary),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Index Page'}),
  },
})
