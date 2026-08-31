import {defineField, defineType} from 'sanity'
import {validateShopFeaturedWidths} from './shopPageContract'

export const shopPage = defineType({
  name: 'shopPage',
  title: 'Shop Page',
  type: 'document',
  fields: [
    defineField({
      name: 'featured',
      title: 'Featured Item',
      type: 'object',
      description:
        'Optional 50/50-style feature above the product grid. If you add the section, Media, Text, and the CTA are all required; Media and Text widths must total full width.',
      fields: [
        defineField({
          name: 'media',
          title: 'Media',
          type: 'contentLayoutMedia',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'text',
          title: 'Text',
          type: 'contentLayoutText',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'ctaLabel',
          title: 'CTA Label',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'ctaHref',
          title: 'CTA Destination',
          type: 'url',
          description: 'Where the CTA links — e.g. /shop/products/some-product or an external URL.',
          validation: (rule) =>
            rule.required().uri({allowRelative: true, scheme: ['http', 'https']}),
        }),
      ],
      validation: (rule) => rule.custom(validateShopFeaturedWidths),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Shop Page'}),
  },
})
