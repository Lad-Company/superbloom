import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./motion.css', import.meta.url), 'utf8')

// The home hero's poster dissolve (GH #172) is the first beat of a cold-load
// ceremony. Layout stamps html[data-nav] on every ClientRouter swap, and a
// swapped-in hero must keep the GH #162 priority exemption (poster at full
// opacity from the first styled frame) or the dissolve replays over the
// route fade as a full-screen flicker (GH #196).
describe('hero poster crossfade opt-in (GH #172, GH #196)', () => {
  it('hides the hero poster before load on cold loads only', () => {
    expect(source).toMatch(
      /html\.js:not\(\[data-nav\]\) media-frame\[data-hero-entrance\] img\s*\{[^}]*opacity:\s*0/,
    )
    expect(source).not.toMatch(/html\.js media-frame\[data-hero-entrance\] img\s*\{/)
  })

  it('leaves the data-loaded reveal ungated', () => {
    expect(source).toMatch(/html\.js media-frame img\[data-loaded\]\s*\{[^}]*opacity:\s*1/)
  })
})
