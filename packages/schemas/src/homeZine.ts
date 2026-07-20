import {defineField, defineType} from 'sanity'
import {validatePortableTextNonEmpty} from './zineContract'

export const homeZine = defineType({
  name: 'homeZine',
  title: 'Zine Promo',
  type: 'object',
  fields: [
    defineField({
      name: 'issue',
      title: 'Issue',
      type: 'reference',
      to: [{type: 'zineIssue'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'promoHeadline',
      title: 'Promo Headline',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'promoIntro',
      title: 'Promo Intro',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required().custom(validatePortableTextNonEmpty),
    }),
    defineField({
      name: 'promoMedia',
      title: 'Promo Media',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'promoHeadline'},
  },
})
