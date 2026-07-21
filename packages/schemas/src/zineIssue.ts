import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'
import {
  validatePortableTextNonEmpty,
  validateArticlesMinThreeAndUnique,
  validateArticlesNotInAnotherIssue,
  validateIssuuUrl,
} from './zineContract'

export const zineIssue = defineType({
  name: 'zineIssue',
  title: 'Zine Issue',
  type: 'document',
  fields: [
    orderRankField({type: 'zineIssue'}),
    defineField({
      name: 'title',
      title: 'Issue Name',
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
      name: 'cardMedia',
      title: 'Card Image',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroMedia',
      title: 'Hero Image',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'editorLetter',
      title: 'Letter from the Editor',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required().custom(validatePortableTextNonEmpty),
    }),
    defineField({
      name: 'articles',
      title: 'Articles',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'article'}],
          options: {filter: 'articleType == "zine" && isExternal != true'},
        },
      ],
      validation: (rule) => [
        rule.required().custom(validateArticlesMinThreeAndUnique),
        rule.custom(validateArticlesNotInAnotherIssue),
      ],
    }),
    defineField({
      name: 'issuuUrl',
      title: 'ISSUU Flipbook URL',
      type: 'url',
      description: 'Paste the public ISSUU publication or embed URL.',
      validation: (rule) => rule.required().custom(validateIssuuUrl),
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
