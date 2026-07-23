import {defineField, defineType} from 'sanity'
import {cardWidthField, infoPositionField, mediaAspectRatioField} from './cardSettings'
import {validateResolvedCardOverride} from './cardSettingsContract'

export const newsBlock = defineType({
  name: 'newsBlock',
  title: 'News',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      type: 'string',
    }),
    defineField({
      name: 'items',
      title: 'News Items',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'article'}],
          options: {filter: 'articleType == "news"'},
        },
      ],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'listDefaults',
      title: 'List Defaults',
      type: 'object',
      fields: [
        cardWidthField({required: true}),
        mediaAspectRatioField({required: true}),
        infoPositionField({required: true}),
      ],
      validation: (rule) => rule.required(),
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
              options: {filter: 'articleType == "news"'},
              validation: (rule) => rule.required(),
            }),
            cardWidthField({partial: true}),
            mediaAspectRatioField({partial: true}),
            infoPositionField({partial: true}),
          ],
          validation: (rule) => rule.custom(validateResolvedCardOverride),
        },
      ],
    }),
  ],
  preview: {
    select: {title: 'headline'},
    prepare: ({title}) => ({title: title || 'News', subtitle: 'Authored list'}),
  },
})
