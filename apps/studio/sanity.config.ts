import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {muxInput} from 'sanity-plugin-mux-input'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {colorInput} from '@sanity/color-input'
import {schemaTypes} from '@superbloom/schemas'
import {muxSchemaCompatibility} from './muxSchemaCompatibility'
import {articlePublishAction} from './articlePublishAction'
import {legacyColorInput} from './legacyColorInput'
import {presentation} from './presentation'

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
                    S.listItem()
                      .title('Shop Page')
                      .id('shopPage')
                      .child(S.document().schemaType('shopPage').documentId('shopPage')),
                  ]),
              ),
            S.listItem()
              .title('Content')
              .child(
                S.list()
                  .title('Content')
                  .items([
                    S.listItem()
                      .title('Articles')
                      .id('articles')
                      .child(
                        S.documentList()
                          .title('Articles')
                          .schemaType('article')
                          .filter('_type == "article"')
                          .defaultOrdering([{field: 'publicationDate', direction: 'desc'}]),
                      ),
                    S.divider(),
                    S.documentTypeListItem('caseStudy').title('Case Studies'),
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
    muxSchemaCompatibility(),
    colorInput(),
    presentation,
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(
        (template) =>
          !['news-article', 'editorial-article', 'zine-article'].includes(template.id),
      ),
  },
  document: {
    actions: (actions, context) =>
      context.schemaType === 'article'
        ? actions.map((action) => (action.action === 'publish' ? articlePublishAction : action))
        : actions,
  },
  form: {
    components: {
      input: (props) =>
        props.schemaType.name === 'color'
          ? legacyColorInput(props as Parameters<typeof legacyColorInput>[0])
          : props.renderDefault(props),
    },
  },
})
