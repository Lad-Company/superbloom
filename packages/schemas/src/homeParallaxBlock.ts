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
      validation: (rule) => rule.min(5).max(10),
      description:
        'Five to ten images or videos scattered around the headline at random depths, rendered at their native aspect ratios. They drift with scroll and are pushed away by the cursor. Leave empty to hide the section.',
    }),
    defineField({
      name: 'showImageLayers',
      title: 'Show Image Layers',
      type: 'boolean',
      initialValue: true,
      description:
        'Toggles the scattered image layers on desktop. Layers never render on mobile, regardless of this setting.',
    }),
    defineField({
      name: 'theme',
      title: 'Background',
      type: 'string',
      options: {
        list: [
          {title: 'White', value: 'light'},
          {title: 'Black', value: 'dark'},
        ],
        layout: 'radio',
      },
      initialValue: 'light',
      description: 'Section background and ink color. Unset (existing content) renders White.',
    }),
  ],
  preview: {
    select: {title: 'headline'},
    prepare: ({title}) => ({title: title || 'Parallax', subtitle: 'Parallax block'}),
  },
})
