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
      name: 'news',
      title: '2. News',
      type: 'newsBlock',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'parallax',
      title: '3. Parallax',
      type: 'homeParallaxBlock',
    }),
    defineField({
      name: 'capabilities',
      title: '4. Capabilities',
      type: 'capesBlock',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'work',
      title: '5. Our Work',
      type: 'homeWorkBlock',
    }),
    defineField({
      name: 'why',
      title: '6. Creative Collective',
      type: 'homeWhyBlock',
    }),
    defineField({
      name: 'zine',
      title: '7. Zine',
      type: 'homeZine',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'contact',
      title: '8. Contact',
      type: 'contactBlock',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Homepage'}),
  },
})
