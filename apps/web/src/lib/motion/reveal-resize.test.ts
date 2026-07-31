// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

// Stub matchMedia on window before reveal.ts (which imports gsap and registers
// ScrollTrigger, whose enable() calls matchMedia) is loaded.
const matchMediaStub = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: () => false,
})
vi.stubGlobal('matchMedia', matchMediaStub)
// SplitType calls window.scrollTo to measure; jsdom doesn't implement it.
vi.stubGlobal('scrollTo', vi.fn())

const {revealText} = await import('./reveal')
const gsapModule = await import('gsap')

// Regression test for the bug: the home header text disappears on window
// resize. The Type Reveal animation re-creates its paused fromTo tween when
// splitText re-splits on resize, and the paused tween immediately renders the
// "from" state (autoAlpha 0, yPercent 100) on the new split units,
// hiding them permanently.
//
// GSAP's internal ticker doesn't reliably advance under vi.useFakeTimers, so
// we fast-forward the global timeline to simulate "the reveal already played".

describe('revealText on window resize', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps text visible after a resize once the reveal has played', async () => {
    const h1 = document.createElement('h1')
    h1.textContent = 'Hello bloom world'
    Object.defineProperty(h1, 'offsetWidth', {configurable: true, value: 320})
    document.body.appendChild(h1)

    // Reveal plays immediately (data-scroll="false" behavior). Use chars unit
    // because the PageHero.astro h1 uses data-unit="chars".
    await revealText(h1, {unit: 'chars', scroll: false})

    // Force the GSAP timeline to its end frame so the reveal is "complete"
    // and the targets are in the visible end-state. This simulates the user
    // letting the page-entry reveal animation finish playing.
    gsapModule.default.globalTimeline.progress(1)
    // Force-render any pending writes so the computed styles reflect the end.
    flushStyleRecalc()

    const initialChars = collectDeepestSpans(h1)
    expect(initialChars.length).toBeGreaterThan(0)
    for (const ch of initialChars) {
      expect(isVisible(ch), `pre-resize ${describeEl(ch)} should be visible`).toBe(true)
    }

    // Simulate a width change + resize event. splitText reverts the existing
    // split, creates new spans, and runs its onResplit callback.
    Object.defineProperty(h1, 'offsetWidth', {configurable: true, value: 480})
    window.dispatchEvent(new Event('resize'))
    await flushRaf()

    // After resize, the new split targets must still be visible. The bug is
    // that gsap.fromTo renders the from-state immediately even when paused,
    // so the freshly-split targets end up autoAlpha: 0 again.
    const postResizeChars = collectDeepestSpans(h1)
    expect(postResizeChars.length).toBeGreaterThan(0)
    for (const ch of postResizeChars) {
      expect(isVisible(ch), `post-resize ${describeEl(ch)} should be visible`).toBe(true)
    }
  })
})

async function flushRaf(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

function flushStyleRecalc(): void {
  // Force layout to flush so getComputedStyle returns up-to-date values
  // after a manual timeline.progress(1) without an actual rAF tick.
  // Reading offsetWidth on body is enough to trigger a layout flush.
  void document.body.offsetWidth
}

// SplitType lays elements out as lines > words > chars, each level wrapped
// in spans. We grab the deepest spans (chars) and ignore the outer wrapping
// container <h1>.
function collectDeepestSpans(root: HTMLElement): HTMLElement[] {
  const all = Array.from(root.querySelectorAll<HTMLElement>('span'))
  return all.filter((el) => el.querySelector('span') === null)
}

function describeEl(el: HTMLElement): string {
  const text = (el.textContent ?? '').slice(0, 12)
  return `<${el.tagName.toLowerCase()} "${text}">`
}

function isVisible(el: HTMLElement): boolean {
  const view = el.ownerDocument!.defaultView!
  const style = view.getComputedStyle(el)
  if (style.display === 'none') return false
  if (style.visibility === 'hidden' || style.visibility === 'collapse') return false
  const opacity = parseFloat(style.opacity || '1')
  if (Number.isFinite(opacity) && opacity <= 0.01) return false
  return true
}
