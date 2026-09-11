// Visitor-facing Article Types for the /index browse. Zine Articles still
// exist in the CMS but surface under /zine, so they are not a browse filter.
export const ARTICLE_TYPES = ['news', 'editorial'] as const

export type ArticleTypeFilter = (typeof ARTICLE_TYPES)[number]

// Labels are used by the /index TypeFilter UI. Cards no longer show a type
// badge — they render tags only when an editor picks them in the CMS. Zine is
// included because curated sections (e.g. the Index page's Featured) can
// still render a Zine Article card.
export const ARTICLE_TYPE_LABELS: Record<ArticleTypeFilter | 'zine', string> = {
  news: 'News',
  editorial: 'Editorial',
  zine: 'Zine',
}

export const parseArticleTypeFilter = (value: string | null): ArticleTypeFilter | null =>
  (ARTICLE_TYPES as readonly string[]).includes(value ?? '') ? (value as ArticleTypeFilter) : null
