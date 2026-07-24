import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'
import {
  validatePortableTextNonEmpty,
  validateArticlesMinOneAndUnique,
  validateArticlesNotInAnotherIssue,
  validateIssuuUrl,
  validateIssuuOrPdfRequired,
} from './zineContract'
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
      type: 'object',
      fields: [
        defineField({
          name: 'media',
          title: 'Image',
          type: 'mediaBox',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'labels',
          title: 'Labels',
          type: 'array',
          of: [{type: 'string'}],
          validation: (rule) => rule.max(2),
        }),
        defineField({
          name: 'heading',
          title: 'Title',
          type: 'string',
          initialValue: 'Letter from the Editor',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'body',
          title: 'Description',
          type: 'array',
          of: [{type: 'block'}],
          validation: (rule) => rule.required().custom(validatePortableTextNonEmpty),
        }),
        defineField({
          name: 'ctaLabel',
          title: 'CTA Label',
          type: 'string',
          initialValue: 'Read the Zine',
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
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
      validation: (rule) => [
        rule.required().custom(validateArticlesMinOneAndUnique),
        rule.custom(validateArticlesNotInAnotherIssue),
      ],
      description: 'Ordered list of Zine articles for this issue. At least one required.',
    }),
    defineField({
      name: 'listDefaults',
      title: 'Article List Defaults',
      type: 'object',
      fields: [
        cardWidthField({required: true}),
        mediaAspectRatioField({required: true}),
        infoPositionField({required: true}),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'articleOverrides',
      title: 'Article Overrides',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'article',
              type: 'reference',
              to: [{type: 'article'}],
              options: {filter: 'articleType == "zine"'},
              validation: (rule) => rule.required(),
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
      validation: (rule) => rule.custom((value) => (value ? validateIssuuUrl(value) : true)),
      description: 'Paste the public ISSUU publication or embed URL. Provide either ISSUU or PDF, not both.',
    }),
    defineField({
      name: 'pdfAsset',
      title: 'PDF Asset',
      type: 'file',
      options: {accept: '.pdf'},
      description: 'Upload a PDF file. Provide either ISSUU or PDF, not both.',
    }),
  ],
  validation: (rule) =>
    rule.custom((document) => {
      const doc = document as {issuuUrl?: string; pdfAsset?: unknown}
      return validateIssuuOrPdfRequired(doc)
    }),
  preview: {
    select: {title: 'title'},
  },
})
