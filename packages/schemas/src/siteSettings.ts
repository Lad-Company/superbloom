import {defineField, defineType} from 'sanity'
import {cardSettingsFieldGroup} from './cardSettings'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'linkedInUrl',
      title: 'LinkedIn URL',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'vimeoUrl',
      title: 'Vimeo URL',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'youTubeUrl',
      title: 'YouTube URL',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'showFaq',
      title: 'Show FAQ',
      type: 'boolean',
      initialValue: true,
      description:
        'Toggle the FAQ section on the Who We Are page on or off without deleting the questions.',
    }),
    ...cardSettingsFieldGroup({
      title: 'Global Card Defaults',
      collapsed: true,
    }),
  ],
  preview: {
    prepare: () => ({title: 'Site Settings'}),
  },
})
