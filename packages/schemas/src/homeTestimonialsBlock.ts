import {defineField, defineType} from 'sanity'

export const homeTestimonialsBlock = defineType({
  name: 'homeTestimonialsBlock',
  title: 'Testimonials',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      type: 'string',
      initialValue: "What They're Saying",
    }),
    defineField({
      name: 'items',
      title: 'Testimonials',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'testimonialItem',
          fields: [
            defineField({
              name: 'quote',
              title: 'Quote',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'attribution',
              title: 'Attribution',
              type: 'string',
            }),
          ],
          preview: {
            select: {title: 'attribution', subtitle: 'quote'},
            prepare: ({title, subtitle}) => ({
              title: title || 'Testimonial',
              subtitle: typeof subtitle === 'string' ? subtitle.slice(0, 60) : undefined,
            }),
          },
        },
      ],
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Label',
      type: 'string',
    }),
    defineField({
      name: 'ctaHref',
      title: 'CTA URL',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'headline', count: 'items.length'},
    prepare: ({title, count}) => ({
      title: title || 'Testimonials',
      subtitle: `Testimonials block · ${count ?? 0} item(s)`,
    }),
  },
})
