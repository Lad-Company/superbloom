import {defineField, defineType} from 'sanity'
import {validatePortableTextNonEmpty} from './articleContract'

export const articleTextSection = defineType({
  name: 'articleTextSection',
  title: 'Article Text',
  type: 'object',
  fields: [
    defineField({name: 'heading', type: 'string'}),
    defineField({
      name: 'text',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required().custom(validatePortableTextNonEmpty),
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare: ({title}) => ({title: title || 'Article text', subtitle: 'Text section'}),
  },
})
