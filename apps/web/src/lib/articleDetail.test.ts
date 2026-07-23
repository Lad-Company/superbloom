import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {
  editorialArticleBySlugQuery,
  newsArticleBySlugQuery,
  zineArticleBySlugQuery,
} from './queries'

const source = readFileSync(
  new URL('../components/editorial/ArticleDetail.astro', import.meta.url),
  'utf8',
)
const homepageQuerySource = readFileSync(new URL('./queries.ts', import.meta.url), 'utf8')

describe('Article Detail contract', () => {
  it('renders identity and Publication Date with semantic time markup', () => {
    expect(source).toContain("news: 'News'")
    expect(source).toContain("editorial: 'Editorial'")
    expect(source).toContain("zine: 'Zine'")
    expect(source).toContain('<time')
    expect(source).toContain('datetime=')
  })

  it('indicates that external coverage opens in a new tab', () => {
    expect(source).toContain('target="_blank"')
    expect(source).toContain('noopener noreferrer')
    expect(source).toContain('<span aria-hidden="true">↗</span>')
    expect(source).toContain('opens in a new tab')
  })

  it('projects the shared detail fields from every identity route', () => {
    for (const query of [
      newsArticleBySlugQuery,
      editorialArticleBySlugQuery,
      zineArticleBySlugQuery,
    ]) {
      expect(query).toContain('publicationDate')
      expect(query).toContain('leadMedia')
      expect(query).toContain('contentLayoutRow')
      expect(query).toContain('relatedItems')
    }
  })

  it('renders authored related items as a shared More Stories carousel', () => {
    expect(source).toContain("import CardCarousel from '../CardCarousel.astro'")
    expect(source).toContain('heading="More stories"')
    expect(source).toContain('relatedItems.length === 3')
  })

  it('uses the homepage authored News list instead of implicit latest items', () => {
    expect(homepageQuerySource).toContain('"items": items[]->{')
    expect(homepageQuerySource).not.toContain('articleType == "news"] | order(publicationDate desc)[0...8]')
  })
})
