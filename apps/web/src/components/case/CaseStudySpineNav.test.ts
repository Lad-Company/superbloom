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
      /body:has\(\.navigation\.is-shy\.is-revealed\)\)\s*\.spine-nav\[data-stuck\]\s*\{[^}]*transform:\s*translateY\(var\(--shy-bar-h/,
    )
  })

  it('gates the dock on the strip being stuck, so the in-flow strip is never shoved off its seat', () => {
    // Without the gate, revealing the bar while the strip is still in
    // document flow (always the case on mobile, where it starts inside the
    // first viewport) opens a --shy-bar-h gap between the strip and the
    // lead media above it. Tracked from the sentinel's rect on the rAF
    // scroll path — an IntersectionObserver's batched deliveries lag the
    // scroll handler, so the dock engaged and released a beat late.
    expect(source).toContain('class="spine-sentinel"')
    expect(source).not.toContain('new IntersectionObserver')
    // Stuck at the top edge only: past the sentinel, but not bottomed out
    // against the parent's end (where the strip rides up in flow again).
    expect(source).toContain('sentinel.getBoundingClientRect().top < 0')
    expect(source).toContain('parentBottom >= nav.offsetHeight')
    expect(source).toMatch(/const updateActive = \(\) => \{\s*updateStuck\(\)/)
  })

  it("slides on the shy bar's own ramp so the dock reads as one piece of chrome", () => {
    const block = source.match(/\.spine-nav\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(block).toMatch(/transition:\s*transform\s+var\(--motion-quick\)\s+var\(--motion-ease-out\)/)
  })

  it('drops the slide under reduced motion (the bar slide is also disabled there)', () => {
    const reduced = source.match(/prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n {2}\}/)?.[1] ?? ''
    expect(reduced).toMatch(/\.spine-nav\s*\{\s*transition:\s*none/)
  })
})
