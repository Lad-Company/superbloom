import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from '@superbloom/schemas'

export default defineConfig({
  name: 'superbloom',
  title: 'Superbloom',
  projectId: 'l9mhqdtj',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
})
