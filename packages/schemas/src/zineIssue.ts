import {defineField, defineType} from 'sanity'
import {
  validatePortableTextNonEmpty,
  validateArticlesMinThreeAndUnique,
  validateArticlesNotInAnotherIssue,
  validateIssueNumberPositive,
  validateIssueNumberUnique,
  validateEditorLetterComplete,
  validateIssuuUrl,
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
          .integer()
          .custom(validateIssueNumberPositive)
          .custom(validateIssueNumberUnique),
    }),
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
      name: 'publicationDate',
      title: 'Publication Date',
      type: 'datetime',
    }),
    defineField({
      name: 'cardMedia',
      title: 'Card Image',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverAspectRatio',
      title: 'Cover Aspect Ratio',
      type: 'string',
      options: {list: ['16:9', '1:1', '4:5', '9:16', '3:2'], layout: 'radio'},
      initialValue: '4:5',
    }),
    defineField({
      name: 'heroMedia',
      title: 'Hero Image',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'introHeadline',
      title: 'Intro Headline',
      type: 'string',
    }),
    defineField({
      name: 'introText',
      title: 'Intro Text',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) =>
        rule.custom((value) => (value ? validatePortableTextNonEmpty(value) : true)),
    }),
    defineField({
      name: 'introMedia',
      title: 'Intro Media Collage',
      type: 'array',
      of: [{type: 'mediaBox'}],
      validation: (rule) => rule.max(5),
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
        }),
      ],
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
    select: {title: 'title', issueNumber: 'issueNumber', subtitle: 'publicationDate'},
    prepare: ({title, issueNumber, subtitle}) => ({
      title: `Issue ${issueNumber}: ${title}`,
      subtitle,
    }),
  },
})
