import {defineField, defineType} from 'sanity'

export const zineLanding = defineType({
  name: 'zineLanding',
  title: 'Zine Landing',
  type: 'document',
  fields: [
    defineField({
      name: 'currentIssue',
      title: 'Current Issue',
      type: 'reference',
      to: [{type: 'zineIssue'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Zine Intro',
      type: 'object',
      fields: [
        defineField({
          name: 'heading',
          title: 'Heading',
          type: 'text',
          rows: 3,
          initialValue:
            'Original stories, interviews, and visual essays from the creative collective on what helps ideas grow.',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'imageLayers',
          title: 'Image Layers',
          type: 'array',
          of: [{type: 'mediaBox'}],
          validation: (rule) => rule.min(5).max(10),
          description:
            'Five to ten decorative layers scattered at random depths, rendered at their native aspect ratios. They drift with scroll and are pushed away by the cursor.',
        }),
        defineField({
          name: 'ctaLabel',
          title: 'CTA Label',
          type: 'string',
          initialValue: 'Explore the issue',
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Zine Landing'}),
  },
})
