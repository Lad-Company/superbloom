import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(
  new URL('./smoothScroll.ts', import.meta.url),
  'utf8',
)

describe('smoothScroll destroy contract', () => {
  it('halts the Lenis instance before destroying it on route swaps', () => {
    // Without this, a Lenis in-flight smooth-scroll tween keeps firing
    // `setScroll()` after `destroy()` and overrides the *next* page's scroll
    // position with the previous page's target (e.g. case-study pages
    // landing mid-section when the user clicked a case-study card from deep
    // on the homepage). The Layout's settleScrollPosition fights it but
    // loses the post-astro:page-load race.
    const stopIdx = source.indexOf('lenis?.stop')
    const destroyIdx = source.indexOf('lenis?.destroy')
    expect(stopIdx).toBeGreaterThanOrEqual(0)
    expect(destroyIdx).toBeGreaterThan(stopIdx)
  })
})
