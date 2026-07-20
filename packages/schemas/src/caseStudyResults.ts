import {defineField, defineType} from 'sanity'
import {validateStatsCardinality, validateStatComplete} from './caseStudyContract'

export const caseStudyResults = defineType({
  name: 'caseStudyResults',
  title: 'Results',
  type: 'object',
  fields: [
    defineField({
      name: 'surfaceRole',
      title: 'Surface Role',
      type: 'string',
      options: {list: ['case-primary', 'case-secondary'], layout: 'radio'},
      initialValue: 'case-primary',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'caseStudyStat',
          fields: [
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
          validation: (rule) => rule.custom(validateStatComplete),
          preview: {
            select: {value: 'value', label: 'label'},
            prepare: ({value, label}) => ({
              title: value || '(no value)',
              subtitle: label || '(no label)',
            }),
          },
        },
      ],
      validation: (rule) =>
        rule
          .required()
          .custom(validateStatsCardinality),
    }),
  ],
  preview: {
    select: {role: 'surfaceRole', count: 'stats.length'},
    prepare: ({role, count}) => ({
      title: 'Results',
      subtitle: `${count ?? 0} stat(s) · ${role === 'case-secondary' ? 'Secondary' : 'Primary'} Surface`,
    }),
  },
})
