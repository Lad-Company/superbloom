// Article location resolution needs a reverse lookup (Zine Issue -> Article)
// to build /zine/issues/[issue]/[article] URLs. That lookup is a GROQ
// subquery, which cannot live in the object resolver's `select`: the
// Presentation/preview store treats select values as plain field paths
// (split on "."), mangles expressions into invalid GROQ, and the failed
// fetch is retried forever — leaving the editor's "Resolving locations..."
// banner stuck. Articles therefore use the function resolver form (see
// presentation.ts) with this explicit listenQuery query.

// Zine Articles are referenced from their Issue, so the issue slug is a
// reverse lookup. References always point at published IDs, so the query
// normalizes away the "drafts." prefix before matching.
export const ARTICLE_LOCATIONS_QUERY = `*[_type == "article" && _id == $id][0]{
  title,
  "slug": slug.current,
  articleType,
  "issueSlug": *[_type == "zineIssue" && string::split(^._id, "drafts.")[-1] in articles[]._ref][0].slug.current
}`

export type ArticleLocationDoc = {
  title?: string | null
  slug?: string | null
  articleType?: 'news' | 'editorial' | 'zine' | null
  issueSlug?: string | null
}

export function resolveArticleLocations(doc: ArticleLocationDoc | null) {
  if (!doc) return {locations: []}
  if (doc.articleType === 'zine') {
    return {
      locations:
        doc.issueSlug && doc.slug
          ? [
              {
                title: doc.title ?? 'Zine Article',
                href: `/zine/issues/${doc.issueSlug}/${doc.slug}`,
              },
            ]
          : [],
    }
  }
  return {
    locations: doc.slug
      ? [{title: doc.title ?? 'Article', href: `/articles/${doc.slug}`}]
      : [],
  }
}
