import {defineField, defineType} from 'sanity'

export const caseStudyPairedPortraitMedia = defineType({
  name: 'caseStudyPairedPortraitMedia',
  title: 'Paired Portrait Media',
  type: 'object',
  fields: [
    defineField({
      name: 'mediaBoxes',
      title: 'Media',
      type: 'array',
      of: [{type: 'mediaBox'}],
      validation: (rule) =>
        rule
          .required()
          .length(2)
          .error('Paired Portrait Media requires exactly two media items'),
    }),
  ],
  preview: {
    select: {
      asset1: 'mediaBoxes.0.asset.0._type',
      asset2: 'mediaBoxes.1.asset.0._type',
    },
    prepare: ({asset1, asset2}) => {
      const type1 = asset1 === 'mux.video' ? 'Video' : 'Image'
      const type2 = asset2 === 'mux.video' ? 'Video' : 'Image'
      return {
        title: 'Paired Portraits',
        subtitle: `${type1} + ${type2}`,
      }
    },
  },
})
