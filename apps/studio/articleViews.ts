import type {StructureBuilder} from 'sanity/structure'

type ArticleIdentity = {
  id: 'news' | 'editorial' | 'zine'
  title: string
  templateId: string
}

const articleView = (S: StructureBuilder, identity: ArticleIdentity) =>
  S.listItem()
    .title(identity.title)
    .id(identity.id)
    .child(
      S.documentList()
        .title(identity.title)
        .schemaType('article')
        .filter('_type == "article" && articleType == $articleType')
        .params({articleType: identity.id})
        .defaultOrdering([{field: 'publicationDate', direction: 'desc'}])
        .initialValueTemplates([S.initialValueTemplateItem(identity.templateId)]),
    )

export const newsArticleView = (S: StructureBuilder) =>
  articleView(S, {id: 'news', title: 'News', templateId: 'news-article'})

export const editorialArticleView = (S: StructureBuilder) =>
  articleView(S, {
    id: 'editorial',
    title: 'Editorial Articles',
    templateId: 'editorial-article',
  })

export const zineArticleView = (S: StructureBuilder) =>
  articleView(S, {id: 'zine', title: 'Zine Articles', templateId: 'zine-article'})
