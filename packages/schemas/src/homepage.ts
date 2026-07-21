import {defineField, defineType} from 'sanity'

export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: '1. Hero',
      type: 'heroBlock',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'capabilities',
      title: '2. Capabilities',
      type: 'capesBlock',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'news',
      title: '3. News',
      type: 'newsBlock',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'zine',
      title: '4. Zine',
      type: 'homeZine',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'contact',
      title: '5. Contact',
      type: 'contactBlock',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Homepage'}),
  },
})
