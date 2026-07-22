import {defineField, defineType} from 'sanity'
import {
  validateColorRequired,
  validateSecondaryColorWithResults,
  validateCapabilitiesUnique,
  validateCapabilitiesCardinality,
  validatePressUnique,
  validatePressCardinality,
  validateNextProjectNotSelf,
} from './caseStudyContract'
import {cardWidthField, mediaAspectRatioField, infoPositionField, validateInfoPositionWithWidth} from './cardSettings'

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case Study',
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
    // Publication date for Case Studies (required per spec)
    defineField({
      name: 'publicationDate',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    // Work-index card fields. The card thumbnail is a dedicated grid image/video
    // distinct from leadMedia, mirroring the news card shape so the two share one
    // Card component and GROQ projection.
    defineField({
      name: 'cardMedia',
      title: 'Card Media',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    cardWidthField({required: true}),
    mediaAspectRatioField({required: true}),
    infoPositionField({required: true}),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
      validation: (rule) => rule.max(2),
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
    rule.custom((document) => {
      const doc = document as {
        secondaryColor?: unknown
        results?: {backgroundColor?: string}
        cardWidth?: string
        infoPosition?: string
      }
      const secondaryColorValidation = validateSecondaryColorWithResults({
        parent: {
          secondaryColor: doc.secondaryColor,
          results: doc.results,
        },
      })
      if (secondaryColorValidation !== true) return secondaryColorValidation

      return validateInfoPositionWithWidth({parent: doc})
    }),
})
