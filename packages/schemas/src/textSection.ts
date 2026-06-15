import {defineField, defineType} from 'sanity'

export const textSection = defineType({
  name: 'textSection',
  title: 'Text',
  type: 'object',
  fields: [
    defineField({
      name: 'theme',
      type: 'string',
      options: {list: ['light', 'dark', 'primary', 'secondary'], layout: 'radio'},
      initialValue: 'light',
    }),
    defineField({name: 'eyebrow', type: 'string'}),
    defineField({
      name: 'body',
      type: 'array',
      of: [{type: 'block'}],
    }),
  ],
  preview: {
    select: {title: 'eyebrow'},
    prepare: ({title}) => ({title: title || 'Text', subtitle: 'Text Section'}),
  },
})
