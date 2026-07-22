import {defineField, defineType} from 'sanity'
import {
  validateWorkIndexFeaturedCount,
  validateWorkIndexFeaturedCardsUnique,
  validateWorkIndexAllListDefaults,
  validateWorkIndexFeaturedCardsFullyConfigured,
  validateWorkIndexItemOverridesUnique,
} from './workIndexContract'
import {cardWidthField, mediaAspectRatioField, infoPositionField} from './cardSettings'
import {validateResolvedCardOverride} from './cardSettingsContract'

export const workIndex = defineType({
  name: 'workIndex',
  title: 'Work Index',
  type: 'document',
  fields: [
    defineField({
      name: 'heroHeading',
      title: 'Hero Heading',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'allWorkHeading',
      title: 'All Work Heading',
      type: 'string',
      initialValue: 'All work',
    }),

    // Featured section: 0-4 manually ordered Case Studies with full card settings
    defineField({
      name: 'featured',
      title: 'Featured Section',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'featuredCaseStudy',
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
          preview: {
            select: {title: 'caseStudy.title'},
          },
        },
      ],
      validation: (rule) => [
        rule.custom(validateWorkIndexFeaturedCount),
        rule.custom(validateWorkIndexFeaturedCardsUnique),
        rule.custom(validateWorkIndexFeaturedCardsFullyConfigured),
      ],
    }),

    // All section configuration
    defineField({
      name: 'allSection',
      title: 'All Section Settings',
      type: 'object',
      fields: [
        defineField({
          name: 'listDefaults',
          title: 'List Defaults',
          type: 'object',
          description: 'Default card settings for all Case Studies in the All section',
          fields: [
            cardWidthField({required: true}),
            mediaAspectRatioField({required: true}),
            infoPositionField({required: true}),
          ],
          validation: (rule) => rule.required().custom(validateWorkIndexAllListDefaults),
        }),
        defineField({
          name: 'itemOverrides',
          title: 'Item Overrides',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'caseStudy',
                  type: 'reference',
                  to: [{type: 'caseStudy'}],
                  validation: (rule) => rule.required(),
                }),
                cardWidthField({partial: true}),
                mediaAspectRatioField({partial: true}),
                infoPositionField({partial: true}),
              ],
              validation: (rule) => rule.custom(validateResolvedCardOverride),
            },
          ],
          validation: (rule) => rule.custom(validateWorkIndexItemOverridesUnique),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Work Index'}),
  },
})
