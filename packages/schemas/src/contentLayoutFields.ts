import {defineField} from 'sanity'
import {CONTENT_LAYOUT_WIDTHS} from './contentLayoutContract'

export const contentLayoutWidthField = defineField({
  name: 'width',
  title: 'Width',
  type: 'string',
  options: {list: CONTENT_LAYOUT_WIDTHS.map((value) => ({title: value, value})), layout: 'radio'},
  validation: (rule) => rule.required(),
})
