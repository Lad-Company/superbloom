import {defineField, defineType} from 'sanity'
import {cardWidthField, infoPositionField, mediaAspectRatioField} from './cardSettings'
import {validateFeaturedCardFullyConfigured} from './cardSettingsContract'
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
      name: 'items',
      title: 'Case Studies',
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
            cardWidthField({required: true}),
            mediaAspectRatioField({required: true}),
            infoPositionField({required: true}),
          ],
          validation: (rule) => rule.custom(validateFeaturedCardFullyConfigured),
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
