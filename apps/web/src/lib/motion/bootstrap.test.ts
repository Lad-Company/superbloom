// @vitest-environment jsdom
import {afterEach, describe, expect, it, vi} from 'vitest'

// Stub matchMedia before bootstrap.ts pulls in reveal.ts → gsap/ScrollTrigger,
// whose enable() calls matchMedia.
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: () => false,
}))

const {resolveRevealUnit} = await import('./bootstrap')
const {BREAKPOINTS} = await import('../breakpoints')

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {configurable: true, value: width})
}

const el = (attrs: Record<string, string>): HTMLElement => {
  const node = document.createElement('h1')
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value)
  return node
}

describe('resolveRevealUnit', () => {
  afterEach(() => {
    setViewportWidth(1024)
  })

  it('uses data-unit on desktop widths even when data-unit-mobile is set', () => {
    setViewportWidth(BREAKPOINTS.belowDesktopMax + 1)
    expect(resolveRevealUnit(el({'data-unit': 'chars', 'data-unit-mobile': 'words'}))).toBe('chars')
  })

  it('falls back to data-unit-mobile at and below the desktop breakpoint', () => {
    setViewportWidth(BREAKPOINTS.belowDesktopMax)
    expect(resolveRevealUnit(el({'data-unit': 'chars', 'data-unit-mobile': 'words'}))).toBe('words')
    setViewportWidth(375)
    expect(resolveRevealUnit(el({'data-unit': 'chars', 'data-unit-mobile': 'words'}))).toBe('words')
  })

  it('applies data-unit-mobile even when data-unit is absent', () => {
    setViewportWidth(375)
    expect(resolveRevealUnit(el({'data-unit-mobile': 'words'}))).toBe('words')
  })

  it('defaults to lines when no unit attributes are set', () => {
    setViewportWidth(375)
    expect(resolveRevealUnit(el({}))).toBe('lines')
  })
})
