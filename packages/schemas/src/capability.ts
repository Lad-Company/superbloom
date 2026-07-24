import {defineField, defineType} from 'sanity'

export const capability = defineType({
  name: 'capability',
  title: 'Capability',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'contextualCopy',
      title: 'Contextual Copy',
      description: 'Shown in the sticky left panel while this capability is active.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'subtitle',
      title: 'Legacy Contextual Copy',
      description: 'Retained for existing capability records. Move this content to Contextual Copy when editing.',
      type: 'text',
      rows: 3,
      hidden: true,
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'mediaBox',
    }),
  ],
})
