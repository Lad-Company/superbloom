import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

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
    defineField({name: 'client', type: 'string'}),
    defineField({name: 'summary', type: 'text', rows: 3}),
    defineField({
      name: 'capabilities',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'capability'}]}],
      validation: (rule) => rule.min(1),
    }),
    // Work-index card fields. The card thumbnail is a dedicated grid image/video
    // distinct from heroVideo, mirroring the news card shape so the two share one
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
    defineField({name: 'heroMedia', title: 'Hero Media', type: 'mediaBox'}),
    defineField({name: 'year', type: 'string', title: 'Year'}),
    defineField({name: 'industry', type: 'string', title: 'Industry'}),
    defineField({name: 'deliverables', type: 'text', rows: 2, title: 'Deliverables'}),
    defineField({name: 'creativeCollective', type: 'text', rows: 2, title: 'Creative Collective'}),
    // Brand colors stored as hex strings. @sanity/color-input was not added to keep
    // the studio dependency surface minimal; a plain string field is sufficient for
    // the tracer bullet and can be upgraded to a color picker later.
    defineField({
      name: 'primaryColor',
      type: 'string',
      title: 'Primary Brand Color (hex)',
      description: 'e.g. #fdd143',
    }),
    defineField({
      name: 'secondaryColor',
      type: 'string',
      title: 'Secondary Brand Color (hex)',
      description: 'e.g. #cb122d',
    }),
    defineField({
      name: 'body',
      title: 'Page Body',
      type: 'array',
      of: [
        {type: 'highlightsSection'},
        {type: 'textSection'},
        {type: 'mediaSection'},
        {type: 'statsSection'},
      ],
    }),
  ],
})
