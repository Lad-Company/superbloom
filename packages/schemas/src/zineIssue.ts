import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'
import {
  validatePortableTextNonEmpty,
  validateArticlesMinOneAndUnique,
  validateArticlesNotInAnotherIssue,
  validateIssuuUrl,
  isEmbedOnlyHiddenField,
  isEmbedOnlyIssue,
  validateFullIssueField,
} from './zineContract'

const hiddenForEmbedOnly = ({document}: {document?: unknown}) => isEmbedOnlyIssue(document)

/** Hidden fields must not block publishing: validators nested inside the
   full-treatment fields waive themselves for ISSUU-embed-only issues. */
const requiredUnlessEmbedOnlyHidden = (
  value: unknown,
  context: {document?: unknown; path?: unknown[]},
): true | string => {
  if (isEmbedOnlyHiddenField(context)) return true
  return value ? true : 'Required'
}
import {cardWidthField, infoPositionField, mediaAspectRatioField} from './cardSettings'
import {validateResolvedCardOverride} from './cardSettingsContract'

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
      name: 'issueMode',
      title: 'Issue Mode',
      type: 'string',
      description:
        'Full issues get the designed issue page (hero, letter, articles). ISSUU embed only issues skip to a minimal flipbook page — use it for past zines that live on ISSUU.',
      options: {
        list: [
          {title: 'Full issue', value: 'full'},
          {title: 'ISSUU embed only', value: 'embed'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'full',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Super-Header',
      type: 'string',
      description: 'Optional kicker shown above the issue title in the hero, e.g. "Issue No. 5".',
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
      hidden: hiddenForEmbedOnly,
      validation: (rule) => rule.custom(validateFullIssueField),
    }),
    defineField({
      name: 'editorLetter',
      title: 'Letter from the Editor',
      type: 'object',
      hidden: hiddenForEmbedOnly,
      fields: [
        defineField({
          name: 'media',
          title: 'Image',
          type: 'mediaBox',
          validation: (rule) => rule.custom(requiredUnlessEmbedOnlyHidden),
        }),
        defineField({
          name: 'labels',
          title: 'Labels',
          type: 'array',
          of: [{type: 'string'}],
          validation: (rule) =>
            rule.custom((labels, context) => {
              if (isEmbedOnlyHiddenField(context)) return true
              if (Array.isArray(labels) && labels.length > 2)
                return 'Must have at most 2 labels.'
              return true
            }),
        }),
        defineField({
          name: 'heading',
          title: 'Title',
          type: 'string',
          initialValue: 'Letter from the Editor',
          validation: (rule) => rule.custom(requiredUnlessEmbedOnlyHidden),
        }),
        defineField({
          name: 'body',
          title: 'Description',
          type: 'array',
          of: [{type: 'block'}],
          validation: (rule) =>
            rule.custom((value, context) => {
              if (isEmbedOnlyHiddenField(context)) return true
              if (!value) return 'Required'
              return validatePortableTextNonEmpty(value)
            }),
        }),
        defineField({
          name: 'ctaLabel',
          title: 'CTA Label',
          type: 'string',
          initialValue: 'Read the Zine',
          validation: (rule) => rule.custom(requiredUnlessEmbedOnlyHidden),
        }),
      ],
      validation: (rule) => rule.custom(validateFullIssueField),
    }),
    defineField({
      name: 'articles',
      title: 'Articles',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'article'}],
          options: {filter: 'articleType == "zine"'},
        },
      ],
      hidden: hiddenForEmbedOnly,
      validation: (rule) => [
        rule.custom((articles, context) =>
          isEmbedOnlyIssue(context.document) ? true : validateArticlesMinOneAndUnique(articles),
        ),
        rule.custom((articles, context) =>
          isEmbedOnlyIssue(context.document)
            ? true
            : validateArticlesNotInAnotherIssue(articles, context),
        ),
      ],
      description:
        'Ordered list of Zine articles for this issue. At least one required for full issues.',
    }),
    defineField({
      name: 'listDefaults',
      title: 'Article List Defaults',
      type: 'object',
      hidden: hiddenForEmbedOnly,
      fields: [
        cardWidthField({required: true}),
        mediaAspectRatioField({required: true}),
        infoPositionField({required: true}),
      ],
      validation: (rule) => rule.custom(validateFullIssueField),
    }),
    defineField({
      name: 'articleOverrides',
      title: 'Article Overrides',
      type: 'array',
      hidden: hiddenForEmbedOnly,
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'article',
              type: 'reference',
              to: [{type: 'article'}],
              options: {filter: 'articleType == "zine"'},
              validation: (rule) => rule.custom(requiredUnlessEmbedOnlyHidden),
            }),
            cardWidthField({partial: true}),
            mediaAspectRatioField({partial: true}),
            infoPositionField({partial: true}),
          ],
          validation: (rule) => rule.custom(validateResolvedCardOverride),
        },
      ],
    }),
    defineField({
      name: 'issuuUrl',
      title: 'ISSUU Flipbook URL',
      type: 'url',
      validation: (rule) => [
        rule.required(),
        rule.custom((value) => (value ? validateIssuuUrl(value) : true)),
      ],
      description:
        'Paste the public ISSUU publication or embed URL (not the iframe embed code). Powers the flipbook reader page.',
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
