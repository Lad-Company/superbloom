import {defineField, defineType} from 'sanity'

export const news = defineType({
  name: 'news',
  title: 'News',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Headline',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'media',
      type: 'mediaBox',
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Media Aspect Ratio',
      type: 'string',
      options: {list: ['1:1', '16:9', '4:5'], layout: 'radio'},
      initialValue: '16:9',
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 2,
      description: 'One-line description shown on the featured card.',
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: 'externalLinks',
      title: 'External Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'outlet', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'url', type: 'url', validation: (rule) => rule.required()}),
          ],
          preview: {select: {title: 'outlet', subtitle: 'url'}},
        },
      ],
    }),
    defineField({
      name: 'body',
      title: 'Article Body',
      type: 'array',
      of: [
        {type: 'highlightsSection'},
        {type: 'textSection'},
        {type: 'mediaSection'},
        {type: 'statsSection'},
      ],
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'publishedAt'},
  },
})
