import {defineField, defineType} from 'sanity'

export const articleMediaSection = defineType({
  name: 'articleMediaSection',
  title: 'Article Media',
  type: 'object',
  fields: [
    defineField({
      name: 'layout',
      type: 'string',
      options: {
        list: [
          {title: 'Full width', value: 'full-width'},
          {title: 'Editorial rail', value: 'editorial-rail'},
          {title: 'Paired', value: 'paired'},
        ],
        layout: 'radio',
      },
      initialValue: 'full-width',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'mediaBox',
      hidden: ({parent}) => parent?.layout === 'paired',
      validation: (rule) =>
        rule.custom((value, context) =>
          context.parent?.layout === 'paired' || value ? true : 'Media is required.',
        ),
    }),
    defineField({
      name: 'pairedMedia',
      title: 'Paired media',
      type: 'array',
      of: [{type: 'mediaBox'}],
      hidden: ({parent}) => parent?.layout !== 'paired',
      validation: (rule) =>
        rule.custom((value, context) =>
          context.parent?.layout !== 'paired' || value?.length === 2
            ? true
            : 'Paired media requires exactly two items.',
        ),
    }),
  ],
  preview: {
    select: {subtitle: 'layout'},
    prepare: ({subtitle}) => ({title: 'Article media', subtitle}),
  },
})
