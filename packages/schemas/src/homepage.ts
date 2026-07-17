import {defineField, defineType} from 'sanity'

export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'sections',
      title: 'Editorial Composition',
      type: 'array',
      of: [{type: 'heroBlock'}, {type: 'capesBlock'}, {type: 'newsBlock'}, {type: 'contactBlock'}],
      validation: (rule) =>
        rule.required().min(1).custom((sections) => {
          const repeatedModule = sections?.find(
            (section, index) =>
              sections.findIndex((candidate) => candidate._type === section._type) !== index,
          )

          return repeatedModule
            ? `Only one ${repeatedModule._type} module is allowed.`
            : true
        }),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Homepage'}),
  },
})
