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
      name: 'feature',
      title: '4. Feature',
      type: 'homeFeatureBlock',
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
      name: 'testimonials',
      title: '8. Testimonials',
      type: 'homeTestimonialsBlock',
    }),
    defineField({
      name: 'contact',
      title: '9. Contact',
      type: 'contactBlock',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Homepage'}),
  },
})
