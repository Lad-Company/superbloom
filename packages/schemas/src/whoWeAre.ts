import {defineField, defineType} from 'sanity'

export const whoWeAre = defineType({
  name: 'whoWeAre',
  title: 'Who We Are',
  type: 'document',
  fields: [
    defineField({
      name: 'heroHeading',
      title: 'Hero Heading',
      type: 'string',
      initialValue: 'Audiences move fast. We help you move faster.',
    }),
    defineField({
      name: 'featuredMedia',
      title: 'Featured Media',
      type: 'object',
      fields: [
        defineField({
          name: 'media',
          type: 'array',
          of: [{type: 'mux.video'}, {type: 'image'}],
          validation: (rule) => rule.max(1),
        }),
        defineField({
          name: 'aspectRatio',
          type: 'string',
          options: {list: ['1:1', '16:9', '4:5', '2:1'], layout: 'radio'},
          initialValue: '16:9',
        }),
      ],
    }),
    defineField({
      name: 'marquee',
      title: 'Marquee',
      type: 'object',
      fields: [
        defineField({
          name: 'text',
          type: 'string',
          initialValue:
            'Campaigns. Content. Experiences. branded Entertainment. Social. strategy. creative.',
        }),
      ],
    }),
    defineField({
      name: 'introStatement',
      title: 'Intro Statement',
      type: 'text',
      rows: 3,
      initialValue:
        'SuperBloom is an independent creative company built to move brands beyond advertising. We bring varied disciplines together powered by a collective of unexpected minds who make unignorable work.',
    }),
    defineField({
      name: 'statCards',
      title: 'Stat Cards',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'statCard',
          title: 'Stat Card',
          fields: [
            defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'value', type: 'string'}),
            defineField({name: 'description', type: 'text', rows: 2}),
            defineField({
              name: 'items',
              title: 'List Items',
              description: 'For a list-style card (e.g. client names)',
              type: 'array',
              of: [{type: 'string'}],
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        },
      ],
    }),
    defineField({
      name: 'advantageHeadline',
      title: 'Advantage Headline',
      type: 'string',
      initialValue: 'Our unfair advantage',
    }),
    defineField({
      name: 'advantageBlocks',
      title: 'Advantage Blocks',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'advantageBlock',
          title: 'Advantage Block',
          fields: [
            defineField({name: 'heading', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'body', type: 'text', rows: 3}),
            defineField({
              name: 'media',
              type: 'array',
              of: [{type: 'mux.video'}, {type: 'image'}],
              validation: (rule) => rule.max(1),
            }),
            defineField({
              name: 'aspectRatio',
              type: 'string',
              options: {list: ['1:1', '16:9', '4:5', '2:1'], layout: 'radio'},
              initialValue: '1:1',
            }),
          ],
          preview: {select: {title: 'heading'}},
        },
      ],
    }),
    defineField({
      name: 'disciplines',
      title: 'Disciplines',
      description: 'What we do — distinct from the named Capability service offerings',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'discipline',
          title: 'Discipline',
          fields: [
            defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'description', type: 'text', rows: 2}),
          ],
          preview: {select: {title: 'title', subtitle: 'description'}},
        },
      ],
    }),
    defineField({
      name: 'ctas',
      title: 'CTAs (2-up)',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'cta',
          title: 'CTA',
          fields: [
            defineField({name: 'heading', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'label', type: 'string', initialValue: 'Label'}),
            defineField({name: 'href', type: 'string', initialValue: '#'}),
            defineField({
              name: 'media',
              type: 'array',
              of: [{type: 'mux.video'}, {type: 'image'}],
              validation: (rule) => rule.max(1),
            }),
          ],
          preview: {select: {title: 'heading'}},
        },
      ],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'faq',
          title: 'FAQ Item',
          fields: [
            defineField({
              name: 'question',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({name: 'answer', type: 'text', rows: 3}),
          ],
          preview: {select: {title: 'question'}},
        },
      ],
      validation: (rule) => rule.max(6),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Who We Are'}),
  },
})
