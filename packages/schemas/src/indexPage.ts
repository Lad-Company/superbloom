import {defineField, defineType} from 'sanity'
import {
  validateIndexPageFeaturedCardsUnique,
  validateIndexPageFeaturedCount,
  validateIndexPageAllListDefaults,
  validateIndexPageItemOverridesUnique,
} from './indexPageContract'
import {cardWidthField, mediaAspectRatioField, infoPositionField} from './cardSettings'
import {validateResolvedCardOverride} from './cardSettingsContract'

export const indexPage = defineType({
  name: 'indexPage',
  title: 'Index Page',
  type: 'document',
  fields: [
    defineField({
      name: 'header',
      title: 'Header',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    // Featured section: one lead card plus 2-3 side cards, manually ordered.
    // The layout is locked by the frontend (lead 3/4 width, side cards 1:1
    // with info below), so featured cards author no card settings here.
    defineField({
      name: 'featured',
      title: 'Featured Section',
      type: 'array',
      description:
        'First card is the large lead story; the next 2-3 render in the side rail. Add 3-4 cards total, or leave empty.',
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
          ],
          preview: {
            select: {title: 'article.title'},
          },
        },
      ],
      validation: (rule) => [
        rule.custom(validateIndexPageFeaturedCount),
        rule.custom(validateIndexPageFeaturedCardsUnique),
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
