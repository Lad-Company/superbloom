import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {muxInput} from 'sanity-plugin-mux-input'
import {schemaTypes} from '@superbloom/schemas'

const singletons = ['homepage']

export default defineConfig({
  name: 'superbloom',
  title: 'Superbloom',
  projectId: 'l9mhqdtj',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Homepage')
              .id('homepage')
              .child(S.document().schemaType('homepage').documentId('homepage')),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (item) => !singletons.includes(item.getId() as string),
            ),
          ]),
    }),
    muxInput(),
  ],
  schema: {
    types: schemaTypes,
  },
})
