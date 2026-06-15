import {defineField, defineType} from 'sanity'

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
    defineField({name: 'client', type: 'string'}),
    defineField({name: 'summary', type: 'text', rows: 3}),
    defineField({
      name: 'capabilities',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'capability'}]}],
      validation: (rule) => rule.min(1),
    }),
    defineField({name: 'heroVideo', title: 'Hero Video', type: 'mux.video'}),
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
