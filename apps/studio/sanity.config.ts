import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {muxInput} from 'sanity-plugin-mux-input'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {colorInput} from '@sanity/color-input'
import {schemaTypes} from '@superbloom/schemas'

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
              .title('Pages')
              .child(
                S.list()
                  .title('Pages')
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
                    S.listItem()
                      .title('Index Page')
                      .id('indexPage')
                      .child(S.document().schemaType('indexPage').documentId('indexPage')),
                  ]),
              ),
            S.listItem()
              .title('Content')
              .child(
                S.list()
                  .title('Content')
                  .items([
                    S.documentTypeListItem('article').title('Articles'),
                    orderableDocumentListDeskItem({
                      type: 'caseStudy',
                      title: 'Case Studies',
                      S,
                      context,
                    }),
                    orderableDocumentListDeskItem({
                      type: 'zineIssue',
                      title: 'Zine Issues',
                      S,
                      context,
                    }),
                    S.divider(),
                    S.documentTypeListItem('capability').title('Capabilities'),
                    S.documentTypeListItem('tag').title('Tags'),
                  ]),
              ),
            S.listItem()
              .title('Media')
              .child(
                S.documentList()
                  .title('Media')
                  .filter('_type in ["sanity.imageAsset", "sanity.fileAsset", "mux.videoAsset"]'),
              ),
            S.listItem()
              .title('Submissions')
              .child(S.documentTypeList('formSubmission').title('Submissions')),
            S.divider(),
            S.listItem()
              .title('Site Settings')
              .id('siteSettings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
          ]),
    }),
    muxInput(),
    colorInput(),
  ],
  schema: {
    types: schemaTypes,
  },
})
