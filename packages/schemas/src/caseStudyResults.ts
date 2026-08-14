import {defineField, defineType} from 'sanity'
import {validateStatsCardinality, validateStatComplete} from './caseStudyContract'

export const caseStudyResults = defineType({
  name: 'caseStudyResults',
  title: 'Results',
  type: 'object',
  fields: [
    defineField({
      name: 'variant',
      title: 'Stats Style',
      type: 'string',
      description:
        'Quantitative: numeric grid with count-up animation. Qualitative: full-width statement bands on the primary brand color, separated by thin rules.',
      options: {
        list: [
          {title: 'Quantitative', value: 'quantitative'},
          {title: 'Qualitative', value: 'qualitative'},
        ],
        layout: 'radio',
      },
      initialValue: 'quantitative',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description:
        'Quantitative only: section background. Qualitative always uses the primary brand color.',
      options: {
        list: [
          {title: 'Primary brand color', value: 'primary'},
          {title: 'Secondary brand color', value: 'secondary'},
        ],
        layout: 'radio',
      },
      initialValue: 'primary',
      hidden: ({parent}) => (parent as {variant?: string} | undefined)?.variant === 'qualitative',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      description:
        'Quantitative: value is the number (counts up on scroll). Qualitative: value is the headline statement, label the supporting caption.',
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
    select: {backgroundColor: 'backgroundColor', count: 'stats.length', variant: 'variant'},
    prepare: ({backgroundColor, count, variant}) => ({
      title: 'Results',
      subtitle:
        variant === 'qualitative'
          ? `${count ?? 0} stat(s) · Qualitative · Primary background`
          : `${count ?? 0} stat(s) · Quantitative · ${backgroundColor === 'secondary' ? 'Secondary' : 'Primary'} background`,
    }),
  },
})
