import {defineField, defineType} from 'sanity'

export const homeParallaxBlock = defineType({
  name: 'homeParallaxBlock',
  title: 'Parallax',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{type: 'mediaBox'}],
      validation: (rule) => rule.max(4),
      description: 'Up to four images that fan around and follow the cursor. Leave empty to hide the section.',
    }),
  ],
  preview: {
    select: {title: 'headline'},
    prepare: ({title}) => ({title: title || 'Parallax', subtitle: 'Parallax block'}),
  },
})
