import {defineField, definePlugin, defineType} from 'sanity'

const muxProgress = defineType({
  name: 'mux.progress',
  type: 'object',
  fields: [
    defineField({name: 'progress', type: 'number'}),
    defineField({name: 'state', type: 'string'}),
  ],
})

const muxNonStandardInputReasons = defineType({
  name: 'mux.nonStandardInputReasons',
  type: 'object',
  fields: [defineField({name: 'video_bitrate', type: 'string'})],
})

export const muxSchemaCompatibility = definePlugin({
  name: 'mux-schema-compatibility',
  schema: {
    types: (types) => [
      ...types.map((type) => {
        if (type.name !== 'mux.assetData' || !('fields' in type)) return type

        const fields = type.fields ?? []
        const existingNames = new Set(fields.map((field) => field.name))
        const compatibilityFields = [
          defineField({name: 'ingest_type', type: 'string'}),
          defineField({name: 'non_standard_input_reasons', type: 'mux.nonStandardInputReasons'}),
          defineField({name: 'progress', type: 'mux.progress'}),
        ].filter((field) => !existingNames.has(field.name))

        return {...type, fields: [...fields, ...compatibilityFields]}
      }),
      muxProgress,
      muxNonStandardInputReasons,
    ],
  },
})
