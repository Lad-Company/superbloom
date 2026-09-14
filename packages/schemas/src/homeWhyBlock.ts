import {defineField, defineType} from 'sanity'

export const homeWhyBlock = defineType({
  name: 'homeWhyBlock',
  title: 'Creative Collective',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Label',
      type: 'string',
      description:
        'Label only — the CTA always links to the contact form with the Creative Collective inquiry pre-selected.',
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'mediaBox',
    }),
  ],
  preview: {
    select: {title: 'headline'},
    prepare: ({title}) => ({title: title || 'Creative Collective', subtitle: 'Why block'}),
  },
})
