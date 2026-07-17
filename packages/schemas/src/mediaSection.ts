import {defineField, defineType} from 'sanity'

export const mediaSection = defineType({
  name: 'mediaSection',
  title: 'Media',
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
      name: 'layout',
      type: 'string',
      options: {
        list: ['fullBleed16x9', 'pairedSquare', 'textAndMedia'],
        layout: 'radio',
      },
      initialValue: 'fullBleed16x9',
    }),
    defineField({
      name: 'media',
      type: 'array',
      of: [{type: 'mux.video'}, {type: 'image'}],
    }),
    defineField({
      name: 'text',
      title: 'Text (textAndMedia layout)',
      type: 'array',
      of: [{type: 'block'}],
      hidden: ({parent}) => parent?.layout !== 'textAndMedia',
    }),
  ],
  preview: {
    select: {title: 'eyebrow', subtitle: 'layout'},
    prepare: ({title, subtitle}) => ({title: title || 'Media', subtitle: subtitle || 'Media Section'}),
  },
})
