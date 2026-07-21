import {defineField, defineType} from 'sanity'
import {
  validateArticleBody,
  validatePortableTextNonEmpty,
  validateRelatedItems,
} from './articleContract'

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      hidden: ({parent}) => parent?.isExternal,
      validation: (rule) =>
        rule.custom((value, context) => {
          const isExternal = (context.document as {isExternal?: boolean})?.isExternal
          return isExternal || value ? true : 'Slug is required for internal articles.'
        }),
    }),
    defineField({
      name: 'articleType',
      title: 'Article Type',
      type: 'string',
      options: {list: ['news', 'editorial', 'zine'], layout: 'radio'},
      validation: (rule) => rule.required(),
      description: 'Determines routing and field visibility. news = /news/, editorial = /articles/, zine = /zine/issues/[issue]/[article]/',
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
      validation: (rule) => rule.required().min(1).max(2),
      description: 'Tags are principal differentiation between article types. Minimum one required.',
    }),
    defineField({
      name: 'isExternal',
      title: 'External Article',
      type: 'boolean',
      initialValue: false,
      description:
        'External articles are link-only cards. When enabled, only cardMedia, cardAspectRatio, title, tags, and externalUrl are required.',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      hidden: ({parent}) => !parent?.isExternal,
      validation: (rule) =>
        rule.custom((value, context) => {
          const document = context.document as {isExternal?: boolean; articleType?: string}
          const isExternal = document?.isExternal
          if (isExternal && !value) return 'External URL is required for external articles.'
          if (isExternal && document.articleType !== 'news') {
            return 'External link-only articles must use the News article type.'
          }
          return true
        }),
    }),
    // Card fields (required for all articles)
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
    // Internal-only fields (hidden for external articles)
    defineField({
      name: 'publicationDate',
      type: 'datetime',
      hidden: ({parent}) => parent?.isExternal,
      validation: (rule) =>
        rule.custom((value, context) => {
          const isExternal = (context.document as {isExternal?: boolean})?.isExternal
          if (!isExternal && !value) return 'Publication date is required for internal articles.'
          return true
        }),
    }),
    defineField({
      name: 'overview',
      type: 'array',
      of: [{type: 'block'}],
      hidden: ({parent}) => parent?.isExternal,
      validation: (rule) =>
        rule.custom((value, context) => {
          const isExternal = (context.document as {isExternal?: boolean})?.isExternal
          if (isExternal) return true
          if (!value) return 'Overview is required for internal articles.'
          return validatePortableTextNonEmpty(value)
        }),
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [{type: 'articleTextSection'}, {type: 'articleMediaSection'}],
      hidden: ({parent}) => parent?.isExternal,
      validation: (rule) =>
        rule.custom((value, context) => {
          const isExternal = (context.document as {isExternal?: boolean})?.isExternal
          if (isExternal) return true
          const articleType = (context.document as {articleType?: string})?.articleType
          const externalCoverage = (context.document as {externalCoverage?: unknown[]})?.externalCoverage
          return validateArticleBody(value, {
            document: {_type: articleType, externalCoverage},
          })
        }),
    }),
    defineField({
      name: 'leadMedia',
      type: 'mediaBox',
      hidden: ({parent}) => parent?.isExternal,
      validation: (rule) =>
        rule.custom((value, context) => {
          const isExternal = (context.document as {isExternal?: boolean})?.isExternal
          if (isExternal) return true
          if (!value) return 'Lead media is required for internal articles.'
          return true
        }),
    }),
    defineField({
      name: 'externalCoverage',
      title: 'External Coverage',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'outlet', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'url', type: 'url', validation: (rule) => rule.required()}),
            defineField({name: 'isPrimary', type: 'boolean', initialValue: false}),
          ],
          preview: {select: {title: 'outlet', subtitle: 'url'}},
        },
      ],
      hidden: ({parent}) => parent?.isExternal,
      description: 'Optional for internal articles. Links to coverage of this article elsewhere.',
    }),
    defineField({
      name: 'relatedItems',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'article'}]}],
      hidden: ({parent}) => parent?.isExternal,
      validation: (rule) => rule.custom(validateRelatedItems),
      description: 'Related articles. Must be empty or contain exactly three unique items.',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'publicationDate', type: 'articleType'},
    prepare: ({title, subtitle, type}) => ({
      title: `${title} (${type})`,
      subtitle,
    }),
  },
})
