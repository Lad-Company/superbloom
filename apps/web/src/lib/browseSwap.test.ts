import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./browseSwap.ts', import.meta.url), 'utf8')

describe('browseSwap', () => {
  it('swaps only the browse results in place instead of reloading the full page', () => {
    expect(source).toContain('event.preventDefault()')
    expect(source).toContain('fetch(url)')
    expect(source).toContain('data-browse-results')
    expect(source).toContain('.innerHTML')
    expect(source).toContain('history.pushState')
    expect(source).toContain("addEventListener('popstate'")
  })

  it('intercepts clicks in the capture phase, ahead of the ClientRouter', () => {
    // The layout's ClientRouter (astro:transitions) intercepts link clicks with
    // a bubble-phase document listener and skips events whose default is
    // already prevented; capture keeps browse controls off full page loads.
    expect(source).toContain('capture: true')
  })

  it('intercepts both the sort toggle and the type filter links', () => {
    expect(source).toContain('[data-sort-toggle]')
    expect(source).toContain('[data-type-filter]')
  })

  it('keeps the sort toggle mounted and syncs its attributes so the arrow animates', () => {
    expect(source).toContain('syncSortToggle')
    expect(source).toContain("setAttribute('data-direction'")
    expect(source).toContain("setAttribute('href'")
    expect(source).not.toContain('toggle.replaceWith')
  })

  it('swaps which browse control is displayed on label click, without navigating', () => {
    expect(source).toContain('[data-mode-swap]')
    expect(source).toContain('[data-active-control]')
    expect(source).toContain("dataset.activeControl === 'filter' ? 'sort' : 'filter'")
  })

  it('restores only its own history entries and leaves router entries alone', () => {
    expect(source).toContain('history.pushState(null')
    expect(source).toContain('history.state !== null')
  })
})
