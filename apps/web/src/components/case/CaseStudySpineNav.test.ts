import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./CaseStudySpineNav.astro', import.meta.url), 'utf8')

describe('CaseStudySpineNav shy-bar docking', () => {
  it('docks below the revealed shy bar by its published height', () => {
    // The revealed shy bar (fixed, z-30) and this strip (sticky, top: 0)
    // occupy the same viewport strip: the frost ghosts the tab text through
    // and the bar eats every tap meant for the chapters. While revealed the
    // strip translates down by --shy-bar-h (published by lib/shyNav.ts);
    // the offset lifts when the bar hides.
    expect(source).toMatch(
      /body:has\(\.navigation\.is-shy\.is-revealed\)\)\s*\.spine-nav\s*\{[^}]*transform:\s*translateY\(var\(--shy-bar-h/,
    )
  })

  it("slides on the shy bar's own ramp so the dock reads as one piece of chrome", () => {
    const block = source.match(/\.spine-nav\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(block).toMatch(/transition:\s*transform\s+var\(--motion-quick\)\s+var\(--motion-ease-out\)/)
  })

  it('drops the slide under reduced motion (the bar slide is also disabled there)', () => {
    const reduced = source.match(/prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n  \}/)?.[1] ?? ''
    expect(reduced).toMatch(/\.spine-nav\s*\{\s*transition:\s*none/)
  })
})
