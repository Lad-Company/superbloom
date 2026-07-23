import {defineField, defineType} from 'sanity'
import {
  validateArticleBody,
  validatePortableTextNonEmpty,
  validateRelatedItems,
  validateExternalCoverage,
  validateScopedSlugUniqueness,
} from './articleContract'
import {validateZineArticleIssueMembership} from './zineContract'
import {cardWidthField, mediaAspectRatioField, infoPositionField, validateInfoPositionWithWidth} from './cardSettings'

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
      validation: (rule) => rule.required().custom(validateScopedSlugUniqueness),
    }),
    defineField({
      name: 'articleType',
      title: 'Article Type',
      type: 'string',
      options: {list: ['news', 'editorial', 'zine'], layout: 'radio'},
      validation: (rule) => rule.required(),
      description: 'Determines routing and field visibility. news = /news/, editorial = /articles/, zine = /zine/issues/[issue]/[article]/',
      hidden: true,
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
      validation: (rule) => rule.max(2),
      description: 'Tags. Max 2 allowed.',
    }),

    defineField({
      name: 'cardMedia',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    cardWidthField({required: true}),
    mediaAspectRatioField({required: true}),
    infoPositionField({required: true}),
    defineField({
      name: 'publicationDate',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'overview',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return 'Overview is required.'
          return validatePortableTextNonEmpty(value)
        }),
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        {type: 'contentLayoutRow'},
      ],
      validation: (rule) =>
        rule.custom((value, context) => {
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
      validation: (rule) => rule.required(),
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
      description: 'Optional for News articles. Links to external coverage of this story.',
      hidden: ({document}) => document?.articleType !== 'news',
    }),
    defineField({
      name: 'cardDestination',
      title: 'Card Destination',
      type: 'string',
      options: {list: ['internal', 'external'], layout: 'radio'},
      initialValue: 'internal',
      description:
        'News only. When "external", card links to the primary external coverage link instead of article detail.',
      hidden: ({document}) => document?.articleType !== 'news',
    }),
    defineField({
      name: 'relatedItems',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'article'}]}],
      validation: (rule) => rule.custom(validateRelatedItems),
      description: 'Related articles. Must be empty or contain exactly three unique items.',
    }),
  ],
  validation: (rule) =>
    rule.custom((document, context) => {
      const doc = document as {
        _id?: string
        articleType?: string
        cardWidth?: string
        infoPosition?: string
        cardDestination?: string
        externalCoverage?: unknown[]
      }
      const settingsResult = validateInfoPositionWithWidth({parent: doc})
      if (settingsResult !== true) return settingsResult
      const coverageResult = validateExternalCoverage(doc.externalCoverage, {parent: doc})
      if (coverageResult !== true) return coverageResult
      return validateZineArticleIssueMembership(doc, {
        document: doc,
        getClient: (options) => context.getClient(options),
      })
    }),
  preview: {
    select: {title: 'title', subtitle: 'publicationDate', type: 'articleType'},
    prepare: ({title, subtitle, type}) => ({
      title: `${title} (${type})`,
      subtitle,
    }),
  },
})
