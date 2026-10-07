import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./fonts.css', import.meta.url), 'utf8')

// The display face is only ever rendered uppercase (every Uno display
// shortcut and hand-rolled display-tight usage sets text-transform:
// uppercase), so its fallback is matched on frequency-weighted caps
// advances, not full-repertoire average width. The avgW value (75.52%) set
// caps ~13–18% too wide and flipped the /work hero's balanced line count on
// font swap — cold-load CLS 0.4. Pin the caps-matched value so a future
// font regeneration doesn't silently restore the avgW tuning.
describe('metric-matched fallbacks', () => {
  it('matches the display fallback on caps advances, not repertoire average', () => {
    const face = source.slice(source.indexOf("'PP Neue Corp Tight Fallback'"))
    expect(face).toContain('size-adjust: 66.91%')
  })

  it('keeps the fallback absolute metrics constant (override% × size-adjust)', () => {
    const face = source.slice(source.indexOf("'PP Neue Corp Tight Fallback'"))
    const scale = Number(face.match(/size-adjust: ([\d.]+)%/)?.[1]) / 100
    for (const [name, hhea] of [
      ['ascent-override', 2134 / 2048],
      ['descent-override', 700 / 2048],
      ['line-gap-override', 280 / 2048],
    ] as const) {
      const override = Number(face.match(new RegExp(`${name}: ([\\d.]+)%`))?.[1]) / 100
      // The browser multiplies the override by the size-adjusted em; the
      // product must reproduce the real face's hhea metric within 0.5%.
      expect(Math.abs(override * scale - hhea)).toBeLessThan(0.005)
    }
  })
})
