import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./ContactBand.astro', import.meta.url), 'utf8')

describe('ContactBand', () => {
  it('binds the submit handler on astro:page-load so it survives ClientRouter swaps', () => {
    // The ClientRouter does not re-run an identical module script when
    // swapping between two pages that both render this component, so
    // module-eval binding leaves the swapped-in form unbound: submits fall
    // back to a native GET (page reload, field values leaked into the URL)
    // and never reach /api/contact.
    expect(source).toContain("document.addEventListener('astro:page-load'")
  })

  it('dedupes repeat page-load runs with a dataset guard', () => {
    expect(source).toMatch(/form\.dataset\.\w+/)
  })

  it('stamps startedAt inside the page-load init, not at module eval', () => {
    // The hidden timestamp must be re-stamped on every page load — a swapped-
    // in form has an empty startedAt, which the API rejects as a stale fill.
    const initBody = source.match(/function initContactForm\(\)[\s\S]*?\n {2}\}/)?.[0] ?? ''
    expect(initBody).toContain("startedAt.value = String(Date.now())")
  })

  it('keeps the inquiry-preset click handler delegated from document', () => {
    expect(source).toContain("closest('[data-contact-inquiry]')")
    expect(source).toContain("document.addEventListener('click'")
  })
})
