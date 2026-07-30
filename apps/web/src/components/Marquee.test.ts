import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./Marquee.astro', import.meta.url), 'utf8')

describe('Marquee', () => {
  it('slows playback on hover instead of pausing', () => {
    expect(source).toContain('MARQUEE_SLOW_RATE')
    expect(source).toContain("addEventListener('pointerenter'")
    expect(source).toContain("addEventListener('pointerleave'")
    expect(source).toContain('updatePlaybackRate')
  })

  it('binds hover on astro:page-load so it survives client-side navigation', () => {
    expect(source).toContain("document.addEventListener('astro:page-load'")
  })

  it('renders slotted content twice with the duplicate hidden and inert', () => {
    expect(source).toContain('class="marquee-set"')
    expect(source).toContain('aria-hidden="true" inert')
  })

  it('keeps items reachable under reduced motion via a scrollable rail', () => {
    expect(source).toContain('prefers-reduced-motion')
    expect(source).toContain('.marquee-track--items')
    expect(source).toContain('overflow-x: auto')
  })
})
