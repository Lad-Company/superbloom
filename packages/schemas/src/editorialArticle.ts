import {defineField, defineType} from 'sanity'
import {validateArticleBody, validatePortableTextNonEmpty, validateRelatedItems} from './articleContract'

export const editorialArticle = defineType({
  name: 'editorialArticle',
  title: 'Editorial Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
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
      name: 'publicationDate',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'overview',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required().custom(validatePortableTextNonEmpty),
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [{type: 'articleTextSection'}, {type: 'articleMediaSection'}],
      validation: (rule) => rule.required().custom(validateArticleBody),
    }),
    defineField({
      name: 'leadMedia',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cardMedia',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cardAspectRatio',
      type: 'string',
      options: {list: ['16:9', '1:1', '4:5', '3:2'], layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: 'relatedItems',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'news'}, {type: 'editorialArticle'}]}],
      validation: (rule) => rule.custom(validateRelatedItems),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'publicationDate'},
  },
})
