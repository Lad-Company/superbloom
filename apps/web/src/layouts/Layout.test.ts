import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./Layout.astro', import.meta.url), 'utf8')

// The first-load veil is gone (GH #151, ARCHITECTURE.md ADR-0040). What
// remains of the loading ceremony is a single inline stamp that starts the
// hero's CSS word reveal once fonts are in. These tests pin that contract.
describe('fonts-ready stamp (GH #151)', () => {
  it('stamps html[data-fonts-ready] from an inline head script with no imports', () => {
    const head = source.slice(0, source.indexOf('</head>'))
    const inlineStart = head.indexOf("document.documentElement.classList.add('js')")
    expect(inlineStart).toBeGreaterThan(-1)
    const inline = head.slice(inlineStart, head.indexOf('</script>', inlineStart))
    expect(inline).toContain("setAttribute('data-fonts-ready', '')")
    expect(inline).toContain('document.fonts.ready')
    expect(inline).not.toContain('import ')
  })

  it('caps the font wait so a slow font never holds the reveal', () => {
    expect(source).toMatch(/window\.setTimeout\(resolve, 1000\)/)
    expect(source).toContain('Promise.race([document.fonts.ready, capped])')
  })

  it('stamps the incoming document on View Transition swaps', () => {
    expect(source).toContain("newDocument?.documentElement.setAttribute('data-fonts-ready', '')")
  })

  it('carries no trace of the first-load veil', () => {
    expect(source).not.toContain('PageLoader')
    expect(source).not.toContain('data-veil')
    expect(source).not.toContain('data-critical')
    expect(source).not.toContain('sbh:veil')
    expect(source).not.toContain('data-page-loader')
  })
})
