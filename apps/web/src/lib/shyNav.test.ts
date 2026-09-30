// @vitest-environment jsdom
import {beforeEach, describe, expect, it, vi} from 'vitest'

/* shyNav keeps module-level state (nav ref, listener guard), so each test
   re-imports a fresh module after the DOM and stubs are in place. */

const SSR_BG = '#ffffff'
const SSR_FG = '#000000'
const SURFACE_BG = '#000000'
const SURFACE_FG = '#ffffff'

let nav: HTMLElement
let surface: HTMLElement

const stubMatchMedia = (compact: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: compact,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

const scrollTo = async (y: number) => {
  Object.defineProperty(window, 'scrollY', {value: y, configurable: true})
  window.dispatchEvent(new Event('scroll'))
  // The scroll handler defers to requestAnimationFrame (stubbed sync below);
  // flush microtasks so the state transition settles.
  await Promise.resolve()
}

const reveal = async () => {
  // Down past the nav (offsetHeight is 0 in jsdom) hides it, any upward
  // scroll reveals it.
  await scrollTo(100)
  await scrollTo(90)
}

beforeEach(() => {
  vi.resetModules()
  // jsdom lacks rAF unless pretendToBeVisual is on; run callbacks inline.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })
  document.body.innerHTML = `
    <nav class="navigation" style="--bg: ${SSR_BG}; --fg: ${SSR_FG}"></nav>
    <section data-surface-role="dark" style="--bg: ${SURFACE_BG}; --fg: ${SURFACE_FG}"></section>
  `
  nav = document.querySelector('.navigation')!
  surface = document.querySelector('[data-surface-role]')!
  // jsdom doesn't implement elementFromPoint; stub it outright.
  document.elementFromPoint = (() => surface) as Document['elementFromPoint']
  Object.defineProperty(window, 'scrollY', {value: 0, configurable: true})
})

describe('shyNav theme awareness', () => {
  it('samples the surface beneath the revealed bar on desktop', async () => {
    stubMatchMedia(false)
    const {initShyNav} = await import('./shyNav')
    initShyNav()

    await reveal()

    expect(nav.classList.contains('is-revealed')).toBe(true)
    expect(nav.style.getPropertyValue('--bg').trim()).toBe(SURFACE_BG)
    expect(nav.style.getPropertyValue('--fg').trim()).toBe(SURFACE_FG)
  })

  it('keeps the SSR surface role on compact breakpoints', async () => {
    stubMatchMedia(true)
    const {initShyNav} = await import('./shyNav')
    initShyNav()

    await reveal()

    expect(nav.classList.contains('is-revealed')).toBe(true)
    expect(nav.style.getPropertyValue('--bg').trim()).toBe(SSR_BG)
    expect(nav.style.getPropertyValue('--fg').trim()).toBe(SSR_FG)
  })

  it('still hides and reveals on scroll on compact breakpoints', async () => {
    stubMatchMedia(true)
    const {initShyNav} = await import('./shyNav')
    initShyNav()

    await scrollTo(100)
    expect(nav.classList.contains('is-shy')).toBe(true)
    expect(nav.classList.contains('is-revealed')).toBe(false)

    await scrollTo(90)
    expect(nav.classList.contains('is-revealed')).toBe(true)
  })

  it('publishes the bar height as --shy-bar-h while revealed, so top-edge page chrome can dock beneath it', async () => {
    // The case-study spine nav pins sticky at top: 0 — the same strip the
    // revealed shy bar (fixed, z-30) occupies. It docks beneath the bar via
    // translateY(var(--shy-bar-h)); this var is the contract.
    stubMatchMedia(false)
    Object.defineProperty(nav, 'offsetHeight', {value: 88, configurable: true})
    const {initShyNav} = await import('./shyNav')
    initShyNav()

    await reveal()

    expect(nav.classList.contains('is-revealed')).toBe(true)
    expect(document.documentElement.style.getPropertyValue('--shy-bar-h')).toBe('88px')
  })
})
