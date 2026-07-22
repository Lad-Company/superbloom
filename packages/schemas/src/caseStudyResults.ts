import {defineField, defineType} from 'sanity'
import {validateStatsCardinality, validateStatComplete} from './caseStudyContract'

export const caseStudyResults = defineType({
  name: 'caseStudyResults',
  title: 'Results',
  type: 'object',
  fields: [
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      options: {
        list: [
          {title: 'Primary brand color', value: 'primary'},
          {title: 'Secondary brand color', value: 'secondary'},
        ],
        layout: 'radio',
      },
      initialValue: 'primary',
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
    defineField({
      name: 'supportingRows',
      title: 'Supporting Content',
      type: 'array',
      of: [{type: 'contentLayoutRow'}],
    }),
  ],
  preview: {
    select: {backgroundColor: 'backgroundColor', count: 'stats.length'},
    prepare: ({backgroundColor, count}) => ({
      title: 'Results',
      subtitle: `${count ?? 0} stat(s) · ${backgroundColor === 'secondary' ? 'Secondary' : 'Primary'} background`,
    }),
  },
})
