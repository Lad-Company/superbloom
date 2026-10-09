import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./TagList.astro', import.meta.url), 'utf8')

describe('TagList null tolerance', () => {
  it('drops null entries from dangling tag references before rendering', () => {
    // A tag deleted/unpublished in Sanity while still referenced arrives as
    // null; rendering must not crash on tag.title.
    expect(source).toContain('.filter((tag) => tag != null)')
  })
})
