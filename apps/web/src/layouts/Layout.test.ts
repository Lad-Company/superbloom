import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./Layout.astro', import.meta.url), 'utf8')

// The veil lift moved from the bundled module script to a dedicated inline
// script (GH #149). These tests pin that contract: what the lift waits for,
// how long it can take, and the hooks every lift path stamps.
describe('first-load veil (GH #149)', () => {
  it('lifts from an inline script with no dependency on the bundled chunk', () => {
    expect(source).toContain('<script is:inline data-veil-lift>')
    // The inline script is plain JS: no imports, no TS.
    const inline = source.slice(source.indexOf('<script is:inline data-veil-lift>'))
    const bundled = inline.indexOf('<script>')
    expect(inline.slice(0, bundled)).not.toContain('import ')
  })

  it('waits for preloaded fonts and data-critical elements only', () => {
    expect(source).toContain('document.fonts.ready')
    expect(source).toContain("document.querySelectorAll('[data-critical]')")
  })

  it('drops the rect-intersection heuristic entirely', () => {
    expect(source).not.toContain('getBoundingClientRect')
    expect(source).not.toContain('inInitialViewport')
    expect(source).not.toContain('whenCriticalMediaReady')
  })

  it('caps the wait at 2000ms', () => {
    expect(source).toContain('VEIL_CAP_MS = 2000')
    expect(source).not.toContain('4000')
  })

  it('keeps the 400ms beat and the imperceptible fast path', () => {
    expect(source).toContain('VEIL_BEAT_MS = 400')
    expect(source).toContain('VEIL_IMPERCEPTIBLE_MS = 100')
    expect(source).toContain("loader.setAttribute('data-loader-instant', '')")
  })

  it('keeps the sessionStorage veil-seen skip', () => {
    expect(source).toContain("sessionStorage.getItem('sbh:veil-seen')")
    expect(source).toContain("sessionStorage.setItem('sbh:veil-seen', '1')")
  })

  it('stamps data-veil-lifted on <html> on every lift path', () => {
    // Normal + cap path (the shared lift() in the inline script).
    expect(source).toContain("docEl.setAttribute('data-veil-lifted', '')")
    // The veil-skip head script stamps it immediately, before paint.
    expect(source).toContain("document.documentElement.setAttribute('data-veil-lifted', '')")
    // View Transition navigations stamp the incoming document.
    expect(source).toContain("newDocument?.documentElement.setAttribute('data-veil-lifted', '')")
  })

  it('still dispatches sbh:veil-lifted for the reveal and media holds', () => {
    expect(source).toContain("new CustomEvent('sbh:veil-lifted')")
    expect(source).toContain("loader.setAttribute('data-loader-done', '')")
  })

  it('no longer runs the veil from the bundled module script', () => {
    expect(source).not.toContain('runPageLoader')
    expect(source).not.toContain('isFirstLoad')
  })
})
