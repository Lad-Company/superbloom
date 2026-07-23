import {defineField, defineType} from 'sanity'

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
      initialValue: 'See All Work',
    }),
    defineField({
      name: 'items',
      title: 'Case Studies',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'caseStudy'}]}],
      validation: (rule) => rule.max(6).unique(),
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
