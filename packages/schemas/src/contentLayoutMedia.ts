import {defineField, defineType} from 'sanity'
import {contentLayoutWidthField} from './contentLayoutFields'
import {MEDIA_ASPECT_RATIOS} from './mediaAspectRatio'

export const contentLayoutMedia = defineType({
  name: 'contentLayoutMedia',
  title: 'Media Block',
  type: 'object',
  fields: [
    contentLayoutWidthField,
    defineField({
      name: 'media',
      title: 'Media',
      type: 'mediaBox',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Aspect Ratio',
      type: 'string',
      options: {
        list: MEDIA_ASPECT_RATIOS.map((value) => ({title: value, value})),
        layout: 'radio',
      },
      initialValue: '16:9',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {width: 'width', altText: 'media.altText'},
    prepare: ({width, altText}) => ({
      title: altText || 'Media',
      subtitle: `Media · ${width || 'no width'}`,
    }),
  },
})
