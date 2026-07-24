import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const homepageSchemaSource = readFileSync(new URL('./homepage.ts', import.meta.url), 'utf8')
const homeWorkSchemaSource = readFileSync(new URL('./homeWorkBlock.ts', import.meta.url), 'utf8')
const homepageCompositionSource = readFileSync(
  new URL('../../../apps/web/src/components/home/HomepageComposition.astro', import.meta.url),
  'utf8',
)
const homeWorkComponentSource = readFileSync(
  new URL('../../../apps/web/src/components/blocks/HomeWork.astro', import.meta.url),
  'utf8',
)
const homepageQuerySource = readFileSync(
  new URL('../../../apps/web/src/lib/queries.ts', import.meta.url),
  'utf8',
)

describe('Homepage CMS contract', () => {
  it('does not expose or render the retired Feature section', () => {
    expect(homepageSchemaSource).not.toContain("name: 'feature'")
    expect(homepageCompositionSource).not.toContain('<HomeFeature')
  })

  it('renders only CMS-selected Our Work Case Studies', () => {
    expect(homepageQuerySource).not.toContain('"fallbackWork"')
    expect(homepageCompositionSource).not.toContain('fallbackWork')
  })

  it('configures each Our Work Case Study with card layout settings', () => {
    expect(homeWorkSchemaSource).toContain("name: 'caseStudy'")
    expect(homeWorkSchemaSource).toContain('cardWidthField({required: true})')
    expect(homeWorkSchemaSource).toContain('mediaAspectRatioField({required: true})')
    expect(homeWorkSchemaSource).toContain('infoPositionField({required: true})')
    expect(homeWorkComponentSource).toContain('<ContentCardList')
    expect(homeWorkComponentSource).toContain('settings={entry}')
  })
})
