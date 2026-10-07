import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./HeroHeading.astro', import.meta.url), 'utf8')

// GH #171 (ADR-0040 amendment): the hero entry reveal's hidden state is a
// real CSS rule, not only the keyframes' `from`, so cold loads paint the
// words clipped from the first frame instead of paint-at-rest-then-jump.
// These tests pin the gate's scoping: JS-only (no-JS keeps the heading
// visible), unstamped-only (View Transitions pre-apply the stamp), and
// reduced-motion (no hidden state, no rise).
describe('hero heading first-frame hidden state (GH #171)', () => {
  it('clips the words from the first frame while html.js lacks the fonts stamp', () => {
    expect(source).toContain(
      ':global(html.js:not([data-fonts-ready])) .hero-heading--reveal .word__inner',
    )
    expect(source).toMatch(
      /html\.js:not\(\[data-fonts-ready\]\)[^{]*\{[^}]*transform: translateY\(110%\)/,
    )
  })

  it('still keys the rise animation on the fonts stamp with a both fill', () => {
    expect(source).toContain(
      ':global(html.js[data-fonts-ready]) .hero-heading--reveal .word__inner',
    )
    expect(source).toContain(
      'animation: hero-word-rise 400ms var(--motion-ease-out) both',
    )
  })

  it('keeps the heading visible from the first frame under reduced motion', () => {
    const reduce = source.slice(source.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduce).toMatch(/html\.js:not\(\[data-fonts-ready\]\)[^{]*\{[^}]*transform: none/)
    expect(reduce).toContain('animation: none')
  })
})
