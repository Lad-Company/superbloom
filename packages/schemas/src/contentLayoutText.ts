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
    select: {text: 'text', width: 'width'},
    prepare: ({text, width}) => {
      const firstBlock = Array.isArray(text)
        ? text.find((block) => block?._type === 'block')
        : undefined
      const firstLine = firstBlock?.children
        ?.map((child: {text?: string}) => child?.text ?? '')
        .join('')
        .trim()
      return {
        title: firstLine || 'Text',
        subtitle: `Text · ${width || 'no width'}`,
      }
    },
  },
})
