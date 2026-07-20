import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {muxInput} from 'sanity-plugin-mux-input'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {schemaTypes} from '@superbloom/schemas'

const singletons = ['homepage', 'workIndex', 'whoWeAre', 'zineLanding']
// Document types rendered via a custom list item below (excluded from the default list).
const customListed = [...singletons, 'caseStudy', 'zineIssue']

export default defineConfig({
  name: 'superbloom',
  title: 'Superbloom',
  projectId: 'l9mhqdtj',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S, context) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Homepage')
              .id('homepage')
              .child(S.document().schemaType('homepage').documentId('homepage')),
            S.listItem()
              .title('Work Index')
              .id('workIndex')
              .child(S.document().schemaType('workIndex').documentId('workIndex')),
            S.listItem()
              .title('Who We Are')
              .id('whoWeAre')
              .child(S.document().schemaType('whoWeAre').documentId('whoWeAre')),
            S.listItem()
              .title('Zine Landing')
              .id('zineLanding')
              .child(S.document().schemaType('zineLanding').documentId('zineLanding')),
            orderableDocumentListDeskItem({type: 'caseStudy', title: 'Case Studies', S, context}),
            orderableDocumentListDeskItem({type: 'zineIssue', title: 'Zine Issues', S, context}),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (item) => !customListed.includes(item.getId() as string),
            ),
          ]),
    }),
    muxInput(),
  ],
  schema: {
    types: schemaTypes,
  },
})
