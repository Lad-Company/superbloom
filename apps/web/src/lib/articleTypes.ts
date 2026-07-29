// Visitor-facing Article Types for the /index browse. Mirrors the required
// `articleType` select on the Article CMS document; labels match the Type
// badge shown on cards.
export const ARTICLE_TYPES = ['news', 'editorial', 'zine'] as const

export type ArticleTypeFilter = (typeof ARTICLE_TYPES)[number]

export const ARTICLE_TYPE_LABELS: Record<ArticleTypeFilter, string> = {
  news: 'News',
  editorial: 'Editorial',
  zine: 'Zine',
}

export const parseArticleTypeFilter = (value: string | null): ArticleTypeFilter | null =>
  (ARTICLE_TYPES as readonly string[]).includes(value ?? '') ? (value as ArticleTypeFilter) : null
