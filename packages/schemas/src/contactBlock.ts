import {defineField, defineType} from 'sanity'

export const contactBlock = defineType({
  name: 'contactBlock',
  title: 'Contact Form',
  type: 'object',
  fields: [
    defineField({
      name: 'marker',
      title: 'Section',
      type: 'string',
      hidden: true,
      initialValue: 'contact',
      readOnly: true,
    }),
  ],
  preview: {
    prepare: () => ({title: 'Contact Form', subtitle: 'Contact block'}),
  },
})
