import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./index.astro', import.meta.url), 'utf8')

describe('Work index page', () => {
  it('raises the card media cap so CMS-authored ratios survive', () => {
    expect(source).toContain('--card-media-max-height: 120svh')
  })
})
