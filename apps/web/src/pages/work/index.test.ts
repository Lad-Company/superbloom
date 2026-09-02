import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./index.astro', import.meta.url), 'utf8')

describe('Work index page', () => {
  it('raises the card media cap so CMS-authored ratios survive', () => {
    expect(source).toContain('--card-media-max-height: 120svh')
  })

  it('orders the All section by the CMS itemOverrides list before paginating', () => {
    expect(source).toContain('orderCaseStudiesByOverrides')
    expect(source).toContain('workIndex?.allSection?.itemOverrides')
  })
})
