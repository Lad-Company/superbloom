import {defineField, defineType} from 'sanity'

export const homeFeatureBlock = defineType({
  name: 'homeFeatureBlock',
  title: 'Feature',
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
      name: 'primaryMedia',
      title: 'Square Media',
      description: 'Upper-right square media in the homepage feature composition.',
      type: 'mediaBox',
    }),
    defineField({
      name: 'secondaryMedia',
      title: 'Landscape Media',
      description: 'Lower-left landscape media in the homepage feature composition.',
      type: 'mediaBox',
    }),
    defineField({
      name: 'media',
      title: 'Legacy Media',
      description: 'Retained for existing content. Move this media to Square Media when editing.',
      type: 'mediaBox',
      hidden: true,
    }),
  ],
  preview: {
    select: {title: 'headline'},
    prepare: ({title}) => ({title: title || 'Feature', subtitle: 'Feature block'}),
  },
})
