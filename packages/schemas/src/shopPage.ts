import {defineField, defineType} from 'sanity'
import {SHOPIFY_HANDLE_PATTERN, validateShopFeaturedWidths} from './shopPageContract'

export const shopPage = defineType({
  name: 'shopPage',
  title: 'Shop Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heading',
      title: 'Page Heading',
      type: 'string',
      description: 'Shown in the hero. Falls back to "Shop" when empty.',
    }),
    defineField({
      name: 'collectionHandle',
      title: 'Collection Handle',
      type: 'string',
      description:
        'Shopify collection powering the product grid (the collection\u2019s URL slug, e.g. "frontpage"). The grid follows the collection\u2019s own sort order — reorder products in Shopify admin. Empty = all products, alphabetical.',
      validation: (rule) => rule.regex(SHOPIFY_HANDLE_PATTERN, {name: 'Shopify handle'}),
    }),
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
    defineField({
      name: 'hoverColor',
      title: 'Hover Fill',
      type: 'color',
      options: {disableAlpha: true},
      description:
        'Fill color that wipes up behind the product image on hover. Empty = the neutral gray stays.',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Shop Page'}),
  },
})
