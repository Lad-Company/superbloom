import {defineField, defineType} from 'sanity'
import {validatePortableTextNonEmpty} from './caseStudyContract'

export const caseStudyTextMedia = defineType({
  name: 'caseStudyTextMedia',
  title: 'Text + Media',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) =>
        rule.required().custom(validatePortableTextNonEmpty),
    }),
    defineField({
      name: 'mediaBox',
      title: 'Media',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'mediaPosition',
      title: 'Media Position',
      type: 'string',
      options: {list: ['left', 'right'], layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'mediaWidth',
      title: 'Media Width',
      type: 'string',
      options: {
        list: [
          {title: 'Half width', value: 'half'},
          {title: 'Three-quarter width', value: 'three-quarters'},
        ],
        layout: 'radio',
      },
      initialValue: 'three-quarters',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      asset: 'mediaBox.asset.0._type',
      altText: 'mediaBox.altText',
      position: 'mediaPosition',
      width: 'mediaWidth',
    },
    prepare: ({asset, altText, position, width}) => ({
      title: altText || '(no alt text)',
      subtitle:
        (asset === 'mux.video' ? 'Video' : 'Image') +
        ` · ${position}, ${width === 'half' ? 'half' : 'three-quarter'} width`,
    }),
  },
})
