import {defineField, defineType} from 'sanity'
import {
  validateIndexPageFeaturedCardsUnique,
  validateIndexPageFeaturedCount,
  validateIndexPageAllListDefaults,
  validateIndexPageFeaturedCardsFullyConfigured,
  validateIndexPageItemOverridesUnique,
} from './indexPageContract'
import {cardWidthField, mediaAspectRatioField, infoPositionField} from './cardSettings'
import {validateResolvedCardOverride} from './cardSettingsContract'

export const indexPage = defineType({
  name: 'indexPage',
  title: 'Index Page',
  type: 'document',
  fields: [
    // Featured section: 0-4 manually ordered cards with full card settings
    defineField({
      name: 'featured',
      title: 'Featured Section',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'featuredCard',
          fields: [
            defineField({
              name: 'article',
              type: 'reference',
              to: [{type: 'article'}],
              options: {filter: 'articleType in ["news", "editorial", "zine"]'},
              validation: (rule) => rule.required(),
            }),
            cardWidthField({required: true}),
            mediaAspectRatioField({required: true}),
            infoPositionField({required: true}),
          ],
          preview: {
            select: {title: 'article.title'},
          },
        },
      ],
      validation: (rule) => [
        rule.custom(validateIndexPageFeaturedCount),
        rule.custom(validateIndexPageFeaturedCardsUnique),
        rule.custom(validateIndexPageFeaturedCardsFullyConfigured),
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
          description: 'Default card settings for all articles in the All section',
          fields: [
            cardWidthField({required: true}),
            mediaAspectRatioField({required: true}),
            infoPositionField({required: true}),
          ],
          validation: (rule) => rule.required().custom(validateIndexPageAllListDefaults),
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
                  name: 'article',
                  type: 'reference',
                  to: [{type: 'article'}],
                  options: {filter: 'articleType in ["news", "editorial", "zine"]'},
                  validation: (rule) => rule.required(),
                }),
                cardWidthField({partial: true}),
                mediaAspectRatioField({partial: true}),
                infoPositionField({partial: true}),
              ],
              validation: (rule) => rule.custom(validateResolvedCardOverride),
            },
          ],
          validation: (rule) => rule.custom(validateIndexPageItemOverridesUnique),
        }),
        defineField({
          name: 'tagFilter',
          title: 'Tag Filter (Optional)',
          type: 'reference',
          to: [{type: 'tag'}],
          description:
            'Optional. When selected, the All section displays only articles with this tag. Leave empty to show all articles.',
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Index Page'}),
  },
})
