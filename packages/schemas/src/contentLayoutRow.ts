import {defineField, defineType} from 'sanity'
import {
  isFullBleedEligible,
  validateContentLayoutRow,
  validateTwoBlockRowWidths,
} from './contentLayoutContract'

type RowParent = {
  blocks?: Array<{_type?: string; width?: string}>
}

const isSingleNarrow = (parent: RowParent | undefined) =>
  parent?.blocks?.length === 1 && parent.blocks[0]?.width !== 'full'

export const contentLayoutRow = defineType({
  name: 'contentLayoutRow',
  title: 'Content Layout Row',
  type: 'object',
  fields: [
    defineField({
      name: 'blocks',
      title: 'Blocks',
      type: 'array',
      of: [{type: 'contentLayoutMedia'}, {type: 'contentLayoutText'}],
      validation: (rule) =>
        rule.required().min(1).max(2).custom(validateTwoBlockRowWidths),
    }),
    defineField({
      name: 'alignment',
      title: 'Desktop Alignment',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
      hidden: ({parent}) => !isSingleNarrow(parent as RowParent | undefined),
    }),
    defineField({
      name: 'fullBleed',
      title: 'Full Bleed',
      type: 'boolean',
      initialValue: false,
      hidden: ({parent}) => !isFullBleedEligible(parent as RowParent),
    }),
  ],
  validation: (rule) => rule.custom(validateContentLayoutRow),
  preview: {
    select: {blocks: 'blocks', alignment: 'alignment', fullBleed: 'fullBleed'},
    prepare: ({blocks, alignment, fullBleed}) => ({
      title: `Content Layout Row · ${blocks?.length ?? 0} block(s)`,
      subtitle: fullBleed ? 'Full bleed' : alignment || 'Full width',
    }),
  },
})
