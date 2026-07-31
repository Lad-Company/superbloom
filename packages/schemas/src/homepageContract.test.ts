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
const homeZineComponentSource = readFileSync(
  new URL('../../../apps/web/src/components/blocks/HomeZine.astro', import.meta.url),
  'utf8',
)
const homepageQuerySource = readFileSync(
  new URL('../../../apps/web/src/lib/queries.ts', import.meta.url),
  'utf8',
)
const workMosaicSource = readFileSync(
  new URL('../../../apps/web/src/lib/workMosaic.ts', import.meta.url),
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

  it('exposes only media aspect ratio per Our Work Case Study, letting the preset own placement', () => {
    expect(homeWorkSchemaSource).toContain("name: 'caseStudy'")
    expect(homeWorkSchemaSource).toContain('mediaAspectRatioField({required: true})')
    expect(homeWorkSchemaSource).not.toContain('cardWidthField')
    expect(homeWorkSchemaSource).not.toContain('infoPositionField')
  })

  it('renders Our Work as a fixed interlocking mosaic grid', () => {
    expect(homeWorkComponentSource).toContain('class="mosaic"')
    expect(homeWorkComponentSource).toContain('grid-auto-rows: 1cqw')
    expect(homeWorkComponentSource).not.toContain('<ContentCardList')
  })

  it('offers a layoutPreset select whose values match the web mosaic presets', () => {
    expect(homeWorkSchemaSource).toContain("name: 'layoutPreset'")
    const presetNames = [...workMosaicSource.matchAll(/^ {2}'([a-z-]+)': \{$/gm)].map((m) => m[1])
    expect(presetNames.length).toBeGreaterThanOrEqual(3)
    for (const name of presetNames) {
      expect(homeWorkSchemaSource).toContain(`value: '${name}'`)
    }
    expect(homepageQuerySource).toContain('layoutPreset')
    expect(homepageCompositionSource).toContain('preset={homepage.work?.layoutPreset}')
  })

  it('renders the Zine promo at a compact US Letter-like ratio', () => {
    expect(homeZineComponentSource).toContain('ratio="4:5"')
    expect(homeZineComponentSource).toContain('grid-template-columns: minmax(0, 540px) minmax(0, 1fr)')
  })
})
