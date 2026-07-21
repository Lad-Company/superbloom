import {defineField, defineType} from 'sanity'
import {
  validatePortableTextNonEmpty,
  validateArticlesMinOneAndUnique,
  validateArticlesNotInAnotherIssue,
  validateIntroMediaExactlyFive,
  validateIssueNumberPositive,
  validateIssueNumberUnique,
  validatePdfAsset,
  validateEditorLetterComplete,
} from './zineContract'

export const zineIssue = defineType({
  name: 'zineIssue',
  title: 'Zine Issue',
  type: 'document',
  fields: [
    defineField({
      name: 'issueNumber',
      title: 'Issue Number',
      type: 'number',
      validation: (rule) =>
        rule
          .required()
          .integer()
          .custom(validateIssueNumberPositive)
          .custom(validateIssueNumberUnique),
    }),
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publicationDate',
      title: 'Publication Date',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverMedia',
      title: 'Cover Media',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverAspectRatio',
      title: 'Cover Aspect Ratio',
      type: 'string',
      options: {list: ['16:9', '1:1', '4:5', '9:16', '3:2'], layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'introHeadline',
      title: 'Intro Headline',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'introText',
      title: 'Intro Text',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required().custom(validatePortableTextNonEmpty),
    }),
    defineField({
      name: 'introMedia',
      title: 'Intro Media Collage',
      type: 'array',
      of: [{type: 'mediaBox'}],
      validation: (rule) => rule.required().custom(validateIntroMediaExactlyFive),
    }),
    defineField({
      name: 'editorLetter',
      title: 'Editor Letter',
      type: 'object',
      validation: (rule) => rule.required().custom(validateEditorLetterComplete),
      fields: [
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'body',
          title: 'Body',
          type: 'array',
          of: [{type: 'block'}],
          validation: (rule) => rule.required().custom(validatePortableTextNonEmpty),
        }),
        defineField({
          name: 'mediaBox',
          title: 'Media',
          type: 'mediaBox',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'articles',
      title: 'Articles',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'zineArticle'}]}],
      validation: (rule) => [
        rule.required().custom(validateArticlesMinOneAndUnique),
        rule.custom(validateArticlesNotInAnotherIssue),
      ],
    }),
    defineField({
      name: 'pdfAsset',
      title: 'PDF Asset',
      type: 'file',
      validation: (rule) => rule.required().custom(validatePdfAsset),
    }),
  ],
  preview: {
    select: {title: 'title', issueNumber: 'issueNumber', subtitle: 'publicationDate'},
    prepare: ({title, issueNumber, subtitle}) => ({
      title: `Issue ${issueNumber}: ${title}`,
      subtitle,
    }),
  },
})
