import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'
import {
  validateColorRequired,
  validateSecondaryColorWithResults,
  validateCapabilitiesUnique,
  validateCapabilitiesCardinality,
  validatePressUnique,
  validatePressCardinality,
  validateNextProjectNotSelf,
} from './caseStudyContract'

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  fields: [
    orderRankField({type: 'caseStudy'}),
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
      name: 'client',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'summary', type: 'text', rows: 3}),
    defineField({
      name: 'capabilities',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'capability'}]}],
      validation: (rule) =>
        rule
          .required()
          .custom(validateCapabilitiesUnique)
          .custom(validateCapabilitiesCardinality),
    }),
    // Work-index card fields. The card thumbnail is a dedicated grid image/video
    // distinct from leadMedia, mirroring the news card shape so the two share one
    // Card component and GROQ projection.
    defineField({
      name: 'cardMedia',
      title: 'Card Media',
      type: 'mediaBox',
    }),
    defineField({
      name: 'cardAspectRatio',
      title: 'Card Aspect Ratio',
      type: 'string',
      options: {list: ['1:1', '16:9', '4:5', '2:1'], layout: 'radio'},
      initialValue: '16:9',
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: 'cardSize',
      title: 'Card Size',
      description: 'full = own row; half = pairs with the next half card.',
      type: 'string',
      options: {list: ['full', 'half'], layout: 'radio'},
      initialValue: 'half',
    }),
    defineField({
      name: 'primaryColor',
      type: 'color',
      title: 'Primary Brand Color',
      options: {disableAlpha: true},
      validation: (rule) => rule.required().custom(validateColorRequired),
    }),
    defineField({
      name: 'secondaryColor',
      type: 'color',
      title: 'Secondary Brand Color',
      options: {disableAlpha: true},
    }),
    defineField({
      name: 'leadMedia',
      title: 'Lead Media',
      type: 'mediaBox',
    }),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'caseStudyNarrativeSection',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'challenge',
      title: 'Challenge',
      type: 'caseStudyNarrativeSection',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'unexpectedInsight',
      title: 'Unexpected Insight',
      type: 'caseStudyNarrativeSection',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bigIdea',
      title: 'Big Idea',
      type: 'caseStudyNarrativeSection',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'results',
      title: 'Results',
      type: 'caseStudyResults',
      validation: (rule) => rule.required(),
    }),
    // Optional press and next project references (filters to articleType: news in GROQ)
    defineField({
      name: 'press',
      title: 'Press',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'article'}],
          options: {filter: 'articleType == "news"'},
        },
      ],
      validation: (rule) =>
        rule
          .custom(validatePressUnique)
          .custom(validatePressCardinality),
    }),
    defineField({
      name: 'nextProject',
      title: 'Next Project',
      type: 'reference',
      to: [{type: 'caseStudy'}],
      validation: (rule) =>
        rule.custom((nextProject, context) => validateNextProjectNotSelf(nextProject, context)),
    }),
  ],
  validation: (rule) =>
    rule.custom((document) =>
      validateSecondaryColorWithResults({
        parent: document as {
          secondaryColor?: unknown
          results?: {backgroundColor?: string}
        },
      })
    ),
})
