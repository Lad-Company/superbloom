import {describe, expect, it} from 'vitest'
import {pageEntryRevealAllowed} from './reveal'

describe('page-entry reveal guard', () => {
  it('allows the reveal on genuine loads', () => {
    expect(
      pageEntryRevealAllowed({
        reducedMotion: false,
        alreadyRevealed: false,
        routeEntering: false,
      }),
    ).toBe(true)
  })

  it('skips the reveal when entering via a route transition', () => {
    expect(
      pageEntryRevealAllowed({
        reducedMotion: false,
        alreadyRevealed: false,
        routeEntering: true,
      }),
    ).toBe(false)
  })

  it('skips the reveal after it has already played', () => {
    expect(
      pageEntryRevealAllowed({
        reducedMotion: false,
        alreadyRevealed: true,
        routeEntering: false,
      }),
    ).toBe(false)
  })

  it('always reveals under reduced motion so content is visible', () => {
    expect(
      pageEntryRevealAllowed({
        reducedMotion: true,
        alreadyRevealed: false,
        routeEntering: true,
      }),
    ).toBe(true)
  })
})
