import {defineField, defineType} from 'sanity'

export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [{type: 'heroBlock'}, {type: 'capesBlock'}],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Homepage'}),
  },
})
