import {defineField, defineType} from 'sanity'
import {validatePortableTextNonEmpty} from './articleContract'
import {contentLayoutWidthField} from './contentLayoutFields'

export const contentLayoutText = defineType({
  name: 'contentLayoutText',
  title: 'Text Block',
  type: 'object',
  fields: [
    contentLayoutWidthField,
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                title: 'Link',
                type: 'object',
                fields: [
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (rule) =>
                      rule.required().uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
                  }),
                ],
              },
            ],
          },
        },
      ],
      validation: (rule) => rule.required().custom(validatePortableTextNonEmpty),
    }),
  ],
  preview: {
    select: {heading: 'heading', width: 'width'},
    prepare: ({heading, width}) => ({
      title: heading || 'Text',
      subtitle: `Text · ${width || 'no width'}`,
    }),
  },
})
