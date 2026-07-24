import {defineType} from 'sanity'
import {contentLayoutWidthField} from './contentLayoutFields'

export const contentLayoutSpacer = defineType({
  name: 'contentLayoutSpacer',
  title: 'Spacer Block',
  type: 'object',
  fields: [contentLayoutWidthField],
  preview: {
    select: {width: 'width'},
    prepare: ({width}) => ({
      title: 'Spacer',
      subtitle: `Spacer · ${width || 'no width'}`,
    }),
  },
})
