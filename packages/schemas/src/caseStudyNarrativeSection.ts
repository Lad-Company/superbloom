import {defineField, defineType} from 'sanity'
import {validatePortableTextNonEmpty} from './caseStudyContract'

export const caseStudyNarrativeSection = defineType({
  name: 'caseStudyNarrativeSection',
  title: 'Narrative Section',
  type: 'object',
  fields: [
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) =>
        rule.required().custom(validatePortableTextNonEmpty),
    }),
    defineField({
      name: 'mediaLayouts',
      title: 'Media Layouts',
      type: 'array',
      of: [
        {type: 'caseStudyFullBleedMedia'},
        {type: 'caseStudyTextMedia'},
        {type: 'caseStudyPairedPortraitMedia'},
        {type: 'contentLayoutRow'},
      ],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Narrative Section', subtitle: 'Summary + Media'}),
  },
})
