import {defineField, defineType} from 'sanity'
import {
  validateArticleBody,
  validatePortableTextNonEmpty,
  validateRelatedItems,
  validateScopedSlugUniqueness,
} from './articleContract'
import {validateZineArticleIssueMembership} from './zineContract'
import {
  cardWidthField,
  mediaAspectRatioField,
  infoPositionField,
  validateInfoPositionWithWidth,
} from './cardSettings'

const articleTypeOf = (context: {document?: unknown}) =>
  (context.document as {articleType?: string} | undefined)?.articleType

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
      hidden: true,
      description:
        'Auto-generated from the title at first publish (unique across News and Editorial, or within Zine) and frozen from then on.',
      validation: (rule) => rule.required().custom(validateScopedSlugUniqueness),
    }),
    defineField({
      name: 'articleType',
      title: 'Article Type',
      type: 'string',
      options: {list: ['news', 'editorial', 'zine'], layout: 'radio'},
      validation: (rule) => rule.required(),
      description:
        'Determines the field set and where the article appears. news = /articles/ page with an outbound footer CTA, editorial = /articles/ page, zine = article within an issue.',
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
      description:
        'Optional editorial tags, uncapped. The article type chip is added automatically; cards render a capped subset.',
    }),

    defineField({
      name: 'cardMedia',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cardCtaLabel',
      title: 'Card CTA Label',
      type: 'string',
      initialValue: 'Read more',
      description: "Zine cards only. Optional; cards fall back to 'Read more' when empty.",
      hidden: ({document}) => document?.articleType !== 'zine',
    }),
    cardWidthField({required: true}),
    mediaAspectRatioField({required: true}),
    infoPositionField({required: true}),
    defineField({
      name: 'publicationDate',
      type: 'datetime',
      description:
        'Shown on cards and used to sort article lists newest-first. Stamped automatically at first publish when left empty; editable at any time.',
    }),
    defineField({
      name: 'leadMedia',
      type: 'mediaBox',
      // News links out to external coverage and typically carries no internal
      // lead media (ADR-0029 amends 0027's required-leadMedia clause);
      // Editorial and Zine detail pages still require one.
      validation: (rule) =>
        rule.custom((value, context) => {
          if (articleTypeOf(context) === 'news') return true
          if (!value) return 'Lead media is required.'
          return true
        }),
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
      of: [{type: 'contentLayoutRow'}],
      validation: (rule) => rule.custom(validateArticleBody),
    }),
    defineField({
      name: 'destination',
      title: 'Destination',
      type: 'url',
      description: "News only. The outbound URL the article's footer CTA links to.",
      hidden: ({document}) => document?.articleType !== 'news',
      validation: (rule) =>
        rule.custom((value, context) => {
          if (articleTypeOf(context) === 'news' && !value) {
            return 'News articles require a destination URL.'
          }
          return true
        }),
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      description:
        'News only. Optional outlet name (e.g. "Vogue"); the footer CTA reads "Read on {source}".',
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
      }
      const settingsResult = validateInfoPositionWithWidth({parent: doc})
      if (settingsResult !== true) {
        // Either field is a valid fix, so mark both; a bare string lands on
        // the document root and gives editors no direction.
        return {message: settingsResult, paths: [['infoPosition'], ['cardWidth']]}
      }
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
