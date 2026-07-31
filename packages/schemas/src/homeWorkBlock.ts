import {defineField, defineType} from 'sanity'
import {mediaAspectRatioField} from './cardSettings'
import {
  validateWorkIndexFeaturedCardsUnique,
  validateWorkIndexFeaturedCount,
} from './workIndexContract'

export const homeWorkBlock = defineType({
  name: 'homeWorkBlock',
  title: 'Our Work',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      type: 'string',
      initialValue: 'Our Work',
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Label',
      type: 'string',
      initialValue: 'View all',
    }),
    defineField({
      name: 'layoutPreset',
      title: 'Layout Preset',
      description:
        'Desktop mosaic arrangement (mobile always stacks). Values must match the presets in apps/web/src/lib/workMosaic.ts.',
      type: 'string',
      options: {
        list: [
          {title: 'Stagger Right (default)', value: 'stagger-right'},
          {title: 'Stagger Left', value: 'stagger-left'},
          {title: 'Split Stagger', value: 'split-stagger'},
        ],
        layout: 'radio' as const,
      },
      initialValue: 'stagger-right',
    }),
    defineField({
      name: 'items',
      title: 'Case Studies',
      description:
        'Up to 4 case studies form a fixed interlocking mosaic. Recommended orientation by position: 1st landscape, 2nd portrait, 3rd square, 4th landscape.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'homeCaseStudy',
          fields: [
            defineField({
              name: 'caseStudy',
              type: 'reference',
              to: [{type: 'caseStudy'}],
              validation: (rule) => rule.required(),
            }),
            mediaAspectRatioField({required: true}),
          ],
          preview: {
            select: {title: 'caseStudy.title'},
          },
        },
      ],
      validation: (rule) => [
        rule.custom(validateWorkIndexFeaturedCount),
        rule.custom(validateWorkIndexFeaturedCardsUnique),
      ],
    }),
  ],
  preview: {
    select: {title: 'headline', count: 'items.length'},
    prepare: ({title, count}) => ({
      title: title || 'Our Work',
      subtitle: `Work block · ${count ?? 0} item(s)`,
    }),
  },
})
