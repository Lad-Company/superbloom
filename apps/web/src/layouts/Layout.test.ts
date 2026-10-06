import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./Layout.astro', import.meta.url), 'utf8')

// The first-load veil is gone (GH #151, ARCHITECTURE.md ADR-0040). What
// remains of the loading ceremony is a single inline stamp that releases the
// hero's CSS word reveal once the display font is in — and, per the GH #171
// amendment, the words are clipped at translateY(110%) until it lands, so the
// stamp now gates visibility and must wait on the real face, not fonts.ready.
// These tests pin that contract.
describe('fonts-ready stamp (GH #151, GH #171)', () => {
  it('stamps html[data-fonts-ready] from an inline head script with no imports', () => {
    const head = source.slice(0, source.indexOf('</head>'))
    const inlineStart = head.indexOf("document.documentElement.classList.add('js')")
    expect(inlineStart).toBeGreaterThan(-1)
    const inline = head.slice(inlineStart, head.indexOf('</script>', inlineStart))
    expect(inline).toContain("setAttribute('data-fonts-ready', '')")
    expect(inline).not.toContain('import ')
  })

  it('waits on the display face itself, not document.fonts.ready (GH #171)', () => {
    // WebKit can resolve fonts.ready before the preloaded face is applied,
    // rising the words in Arial Narrow and swapping mid-flight.
    expect(source).toContain(`document.fonts.load('750 1em "PP Neue Corp Tight"')`)
    expect(source).toContain('if (!document.fonts || !document.fonts.load)')
    // The only fonts.ready reference left is the comment explaining its
    // rejection; the stamp never waits on it.
    expect(source).not.toContain('Promise.race([document.fonts.ready')
  })

  it('caps the font wait so a hung font load never hides the heading forever', () => {
    expect(source).toMatch(/window\.setTimeout\(resolve, 1000\)/)
    expect(source).toContain(
      `Promise.race([document.fonts.load('750 1em "PP Neue Corp Tight"'), capped])`,
    )
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
