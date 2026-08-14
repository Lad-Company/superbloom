import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {articleBySlugQuery, zineArticleBySlugQuery} from './queries'

const source = readFileSync(
  new URL('../components/editorial/ArticleDetail.astro', import.meta.url),
  'utf8',
)
const articleCardSource = readFileSync(
  new URL('../components/ArticleCard.astro', import.meta.url),
  'utf8',
)
const issueDetailSource = readFileSync(
  new URL('../components/zine/IssueDetail.astro', import.meta.url),
  'utf8',
)
const zineArticlePageSource = readFileSync(
  new URL('../pages/zine/issues/[issueSlug]/[articleSlug].astro', import.meta.url),
  'utf8',
)
const homepageNewsSource = readFileSync(
  new URL('../components/blocks/NewsCarousel.astro', import.meta.url),
  'utf8',
)
const homepageQuerySource = readFileSync(new URL('./queries.ts', import.meta.url), 'utf8')

describe('Article Detail contract', () => {
  it('renders lead media with page gutters and overview with eyebrow', () => {
    expect(source).toContain('class="lead-media"')
    expect(source).toContain('padding: 0 var(--page-inset)')
    expect(source).toContain('Overview')
    expect(source).toContain('class="type-eyebrow overview-eyebrow"')
    expect(source).toContain('class="editorial-title"')
  })

  it('links News and Editorial cards to their /articles/ detail page', () => {
    expect(articleCardSource).toContain('`/articles/${item.slug}`')
    expect(articleCardSource).not.toContain('target="_blank"')
    expect(articleCardSource).not.toContain('item.destination')
  })

  it('serves News and Editorial articles from the /articles/ route', () => {
    expect(articleBySlugQuery).toContain('articleType in ["news", "editorial"]')
  })

  it('renders a News footer CTA linking out to the destination', () => {
    expect(articleBySlugQuery).toContain('destination')
    expect(articleBySlugQuery).toContain('source')
    expect(source).toContain('article.destination')
    expect(source).toContain('`Read on ${article.source}`')
    expect(source).toContain('Read the full story')
    expect(source).toContain('target="_blank"')
    expect(source).toContain('noopener noreferrer')
  })

  it('projects the shared detail fields from every identity route', () => {
    for (const query of [articleBySlugQuery, zineArticleBySlugQuery]) {
      expect(query).toContain('publicationDate')
      expect(query).toContain('leadMedia')
      expect(query).toContain('contentLayoutRow')
    }
  })

  it('only projects authored related items for news/editorial articles', () => {
    expect(articleBySlugQuery).toContain('relatedItems')
    expect(zineArticleBySlugQuery).not.toContain('relatedItems')
  })

  it('projects the issue article rail for zine article pages', () => {
    expect(zineArticleBySlugQuery).toContain('articles[]->')
    expect(zineArticleBySlugQuery).toContain('listDefaults')
    expect(zineArticleBySlugQuery).toContain('articleOverrides')
  })

  it('renders the same zine More Stories rail on issue and article pages', () => {
    for (const page of [issueDetailSource, zineArticlePageSource]) {
      expect(page).toContain('ZineStoriesRail')
    }
  })

  it('renders authored related items as a shared More Stories carousel', () => {
    expect(source).toContain("import CardCarousel from '../CardCarousel.astro'")
    expect(source).toContain('heading="More stories"')
    expect(source).toContain('relatedItems.length === 3')
    expect(source).toContain('--fg: #fff')
  })

  it('renders homepage News as an endlessly looping marquee', () => {
    expect(homepageNewsSource).toContain("import Marquee from '../Marquee.astro'")
    expect(homepageNewsSource).toContain('<Marquee>')
  })

  it('uses the homepage authored News list instead of implicit latest items', () => {
    expect(homepageQuerySource).toContain('"items": items[]->{')
    expect(homepageQuerySource).not.toContain(
      'articleType == "news"] | order(publicationDate desc)[0...8]',
    )
  })
})
